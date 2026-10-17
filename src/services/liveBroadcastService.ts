/**
 * PIGEON-FLY — Supabase Realtime Live Race Broadcasting Service (Z-049, DEC-35)
 * Manages WebSocket broadcast channels, multi-loft arrival transmissions,
 * spectator link generation, and offline queueing.
 */

import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { DerbyArrival, generateDerbyLiveFeed, DerbyStanding } from '../domain/derby';

export interface LiveBroadcastArrivalPayload {
  derbyCode: string;
  arrivalId: string;
  loftId: string;
  loftName: string;
  fancierName: string;
  pigeonRing: string;
  arrivalTime: string; // ISO 8601
  distanceMeters: number;
  velocityMpm: number;
  commentary?: string;
  timestamp: number;
}

export type BroadcastConnectionStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'offline';

export type ArrivalListener = (payload: LiveBroadcastArrivalPayload) => void;
export type StatusListener = (status: BroadcastConnectionStatus) => void;

export class LiveBroadcastService {
  private static instance: LiveBroadcastService;
  private supabase: SupabaseClient | null = null;
  private activeChannels = new Map<string, RealtimeChannel>();
  private arrivalListeners = new Map<string, Set<ArrivalListener>>();
  private statusListeners = new Set<StatusListener>();
  private connectionStatus: BroadcastConnectionStatus = 'disconnected';
  private offlineQueue: LiveBroadcastArrivalPayload[] = [];

  private constructor() {}

  public static getInstance(): LiveBroadcastService {
    if (!LiveBroadcastService.instance) {
      LiveBroadcastService.instance = new LiveBroadcastService();
    }
    return LiveBroadcastService.instance;
  }

  /**
   * Configures the Supabase client instance.
   */
  public setSupabaseClient(client: SupabaseClient | null): void {
    this.supabase = client;
    this.updateStatus(client ? 'connected' : 'offline');
  }

  public getConnectionStatus(): BroadcastConnectionStatus {
    return this.connectionStatus;
  }

  public getOfflineQueue(): LiveBroadcastArrivalPayload[] {
    return [...this.offlineQueue];
  }

  public clearOfflineQueue(): void {
    this.offlineQueue = [];
  }

  /**
   * Generates official public spectator link for section members and fans.
   */
  public generateSpectatorLink(derbyCode: string): string {
    const cleanCode = encodeURIComponent(derbyCode.trim());
    return `https://pigeonfly.app/live/${cleanCode}`;
  }

  /**
   * Subscribes to live arrival events for a specific race/derby channel.
   */
  public subscribeToDerby(
    derbyCode: string,
    onArrival: ArrivalListener
  ): () => void {
    if (!this.arrivalListeners.has(derbyCode)) {
      this.arrivalListeners.set(derbyCode, new Set());
    }
    this.arrivalListeners.get(derbyCode)!.add(onArrival);

    // Initialize Supabase Realtime channel if client available
    if (this.supabase && !this.activeChannels.has(derbyCode)) {
      this.initRealtimeChannel(derbyCode);
    }

    return () => {
      const listeners = this.arrivalListeners.get(derbyCode);
      if (listeners) {
        listeners.delete(onArrival);
        if (listeners.size === 0) {
          this.arrivalListeners.delete(derbyCode);
          this.closeChannel(derbyCode);
        }
      }
    };
  }

  /**
   * Subscribes to connection status changes.
   */
  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Transmits a new arrival event to all spectators via Supabase Realtime.
   * If offline or disconnected, securely queues the payload for automatic resend.
   */
  public async broadcastArrival(
    payload: LiveBroadcastArrivalPayload
  ): Promise<{
    success: boolean;
    channel: string;
    deliveredVia: 'supabase_realtime' | 'offline_queue';
    error?: string;
  }> {
    const channelName = `race-live-${payload.derbyCode}`;
    const enrichedPayload: LiveBroadcastArrivalPayload = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };

    // Notify local in-app listeners immediately (optimistic UI)
    this.notifyLocalListeners(payload.derbyCode, enrichedPayload);

    // If Supabase is available and channel active, broadcast via WebSocket
    if (this.supabase) {
      try {
        let channel = this.activeChannels.get(payload.derbyCode);
        if (!channel) {
          channel = this.initRealtimeChannel(payload.derbyCode);
        }

        const sendResult = await channel.send({
          type: 'broadcast',
          event: 'arrival',
          payload: enrichedPayload,
        });

        if (sendResult === 'ok') {
          return {
            success: true,
            channel: channelName,
            deliveredVia: 'supabase_realtime',
          };
        }
      } catch (err: any) {
        // Enqueue if broadcast failed
        this.offlineQueue.push(enrichedPayload);
        return {
          success: false,
          channel: channelName,
          deliveredVia: 'offline_queue',
          error: err?.message || 'Błąd transmisji WebSocket Supabase.',
        };
      }
    }

    // Supabase not available -> store in offline queue
    this.offlineQueue.push(enrichedPayload);
    return {
      success: true,
      channel: channelName,
      deliveredVia: 'offline_queue',
    };
  }

  /**
   * Flushes offline queue when connection is restored.
   */
  public async flushOfflineQueue(): Promise<{
    flushedCount: number;
    failedCount: number;
  }> {
    if (!this.supabase || this.offlineQueue.length === 0) {
      return { flushedCount: 0, failedCount: 0 };
    }

    const itemsToSend = [...this.offlineQueue];
    this.offlineQueue = [];
    let flushedCount = 0;
    let failedCount = 0;

    for (const item of itemsToSend) {
      try {
        let channel = this.activeChannels.get(item.derbyCode);
        if (!channel) {
          channel = this.initRealtimeChannel(item.derbyCode);
        }

        const result = await channel.send({
          type: 'broadcast',
          event: 'arrival',
          payload: item,
        });

        if (result === 'ok') {
          flushedCount++;
        } else {
          this.offlineQueue.push(item);
          failedCount++;
        }
      } catch {
        this.offlineQueue.push(item);
        failedCount++;
      }
    }

    return { flushedCount, failedCount };
  }

  /**
   * Converts a DerbyArrival + loft metadata into a broadcast payload.
   */
  public createPayloadFromArrival(params: {
    derbyCode: string;
    arrival: DerbyArrival;
    loftName: string;
    fancierName: string;
    commentary?: string;
  }): LiveBroadcastArrivalPayload {
    return {
      derbyCode: params.derbyCode,
      arrivalId: params.arrival.arrivalId,
      loftId: params.arrival.loftId,
      loftName: params.loftName,
      fancierName: params.fancierName,
      pigeonRing: params.arrival.ringNumber,
      arrivalTime: params.arrival.arrivalTime,
      distanceMeters: params.arrival.distanceMeters,
      velocityMpm: params.arrival.velocityMPerMin,
      commentary: params.commentary,
      timestamp: Date.now(),
    };
  }

  /**
   * Converts broadcast payload back to domain DerbyArrival.
   */
  public payloadToDerbyArrival(payload: LiveBroadcastArrivalPayload): DerbyArrival {
    return {
      arrivalId: payload.arrivalId,
      loftId: payload.loftId,
      pigeonId: `p-${payload.pigeonRing}`,
      ringNumber: payload.pigeonRing,
      arrivalTime: payload.arrivalTime,
      distanceMeters: payload.distanceMeters,
      velocityMPerMin: payload.velocityMpm,
    };
  }

  /**
   * Formats ticker alert string for live commentary.
   */
  public formatBroadcastTicker(standing: DerbyStanding): string {
    return generateDerbyLiveFeed(standing);
  }

  // --- Private Helpers ---

  private initRealtimeChannel(derbyCode: string): RealtimeChannel {
    const channelName = `race-live-${derbyCode}`;
    const channel = this.supabase!.channel(channelName);

    channel
      .on('broadcast', { event: 'arrival' }, (response: any) => {
        if (response && response.payload) {
          this.notifyLocalListeners(derbyCode, response.payload as LiveBroadcastArrivalPayload);
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.updateStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.updateStatus('disconnected');
        }
      });

    this.activeChannels.set(derbyCode, channel);
    return channel;
  }

  private closeChannel(derbyCode: string): void {
    const channel = this.activeChannels.get(derbyCode);
    if (channel && this.supabase) {
      this.supabase.removeChannel(channel);
      this.activeChannels.delete(derbyCode);
    }
  }

  private notifyLocalListeners(derbyCode: string, payload: LiveBroadcastArrivalPayload): void {
    const listeners = this.arrivalListeners.get(derbyCode);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error('[LiveBroadcastService] Error in listener callback:', err);
        }
      });
    }
  }

  private updateStatus(status: BroadcastConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((l) => l(status));
  }
}

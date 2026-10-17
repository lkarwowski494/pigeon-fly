/**
 * Test Suite: Supabase Realtime Live Race Broadcasting (Z-049, DEC-35)
 * Multi-loft arrival streaming, WebSocket broadcast channels, spectator links,
 * and offline queueing resilience.
 */

import {
  LiveBroadcastService,
  LiveBroadcastArrivalPayload,
} from '../src/services/liveBroadcastService';
import { DerbyArrival } from '../src/domain/derby';

describe('Supabase Realtime Live Race Broadcasting Service (Z-049)', () => {
  let service: LiveBroadcastService;

  beforeEach(() => {
    service = LiveBroadcastService.getInstance();
    service.setSupabaseClient(null); // default to offline mode for test isolation
    service.clearOfflineQueue();
  });

  describe('Spectator Link Generation', () => {
    it('generates canonical spectator URL from derby broadcast code', () => {
      const link = service.generateSpectatorLink('DERBY-RAWICZ-2026');
      expect(link).toBe('https://pigeonfly.app/live/DERBY-RAWICZ-2026');
    });

    it('safely encodes special characters in derby code', () => {
      const link = service.generateSpectatorLink('DERBY LOT 1/2026');
      expect(link).toBe('https://pigeonfly.app/live/DERBY%20LOT%201%2F2026');
    });
  });

  describe('Payload transformations and domain mapping', () => {
    const mockArrival: DerbyArrival = {
      arrivalId: 'arr-test-1',
      loftId: 'loft-rawicz-01',
      pigeonId: 'p-01',
      ringNumber: 'PL-0284-24-9102',
      arrivalTime: '2026-06-14T11:05:30Z',
      distanceMeters: 382450,
      velocityMPerMin: 1354.21,
    };

    it('creates enriched broadcast payload from domain arrival and loft metadata', () => {
      const payload = service.createPayloadFromArrival({
        derbyCode: 'DERBY-RAWICZ-2026',
        arrival: mockArrival,
        loftName: 'Gołębnik Mistrza',
        fancierName: 'Stanisław Kowalski',
        commentary: 'Przylot lidera sekcji!',
      });

      expect(payload.derbyCode).toBe('DERBY-RAWICZ-2026');
      expect(payload.arrivalId).toBe('arr-test-1');
      expect(payload.loftId).toBe('loft-rawicz-01');
      expect(payload.loftName).toBe('Gołębnik Mistrza');
      expect(payload.fancierName).toBe('Stanisław Kowalski');
      expect(payload.pigeonRing).toBe('PL-0284-24-9102');
      expect(payload.velocityMpm).toBe(1354.21);
      expect(payload.commentary).toBe('Przylot lidera sekcji!');
      expect(payload.timestamp).toBeGreaterThan(0);
    });

    it('reconstructs domain DerbyArrival from incoming broadcast payload', () => {
      const payload: LiveBroadcastArrivalPayload = {
        derbyCode: 'DERBY-RAWICZ-2026',
        arrivalId: 'arr-remote-99',
        loftId: 'loft-02',
        loftName: 'Wichura Loft',
        fancierName: 'Marek Nowak',
        pigeonRing: 'PL-0284-23-4411',
        arrivalTime: '2026-06-14T11:08:12Z',
        distanceMeters: 391200,
        velocityMpm: 1349.50,
        timestamp: Date.now(),
      };

      const arrival = service.payloadToDerbyArrival(payload);
      expect(arrival.arrivalId).toBe('arr-remote-99');
      expect(arrival.loftId).toBe('loft-02');
      expect(arrival.ringNumber).toBe('PL-0284-23-4411');
      expect(arrival.distanceMeters).toBe(391200);
      expect(arrival.velocityMPerMin).toBe(1349.50);
      expect(arrival.arrivalTime).toBe('2026-06-14T11:08:12Z');
    });
  });

  describe('Local subscription and offline resilience', () => {
    it('delivers optimistic broadcast to local listeners even in offline mode', async () => {
      const receivedPayloads: LiveBroadcastArrivalPayload[] = [];
      const unsubscribe = service.subscribeToDerby('DERBY-RAWICZ-2026', (p) => {
        receivedPayloads.push(p);
      });

      const testPayload: LiveBroadcastArrivalPayload = {
        derbyCode: 'DERBY-RAWICZ-2026',
        arrivalId: 'arr-offline-1',
        loftId: 'loft-01',
        loftName: 'Mistrz',
        fancierName: 'Kowalski',
        pigeonRing: 'PL-0284-24-1111',
        arrivalTime: '2026-06-14T11:00:00Z',
        distanceMeters: 380000,
        velocityMpm: 1350.0,
        timestamp: Date.now(),
      };

      const result = await service.broadcastArrival(testPayload);
      expect(result.deliveredVia).toBe('offline_queue');
      expect(result.channel).toBe('race-live-DERBY-RAWICZ-2026');
      expect(receivedPayloads).toHaveLength(1);
      expect(receivedPayloads[0].pigeonRing).toBe('PL-0284-24-1111');

      // Verify stored in offline queue
      const queue = service.getOfflineQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].arrivalId).toBe('arr-offline-1');

      unsubscribe();
    });

    it('stops notifying listener after unsubscription', async () => {
      let count = 0;
      const unsubscribe = service.subscribeToDerby('DERBY-RAWICZ-2026', () => {
        count++;
      });

      const testPayload: LiveBroadcastArrivalPayload = {
        derbyCode: 'DERBY-RAWICZ-2026',
        arrivalId: 'arr-unsub-1',
        loftId: 'loft-01',
        loftName: 'Mistrz',
        fancierName: 'Kowalski',
        pigeonRing: 'PL-0284-24-1111',
        arrivalTime: '2026-06-14T11:00:00Z',
        distanceMeters: 380000,
        velocityMpm: 1350.0,
        timestamp: Date.now(),
      };

      await service.broadcastArrival(testPayload);
      expect(count).toBe(1);

      unsubscribe();

      await service.broadcastArrival({
        ...testPayload,
        arrivalId: 'arr-unsub-2',
      });
      expect(count).toBe(1);
    });

    it('reports connection status changes', () => {
      const statuses: string[] = [];
      const unsub = service.onStatusChange((s) => statuses.push(s));

      expect(statuses).toContain('offline');

      // Fake mock client
      const mockSupabase = {
        channel: jest.fn().mockReturnValue({
          on: jest.fn().mockReturnThis(),
          subscribe: jest.fn().mockImplementation((cb) => cb('SUBSCRIBED')),
          send: jest.fn().mockResolvedValue('ok'),
        }),
        removeChannel: jest.fn(),
      } as any;

      service.setSupabaseClient(mockSupabase);
      expect(statuses).toContain('connected');

      service.setSupabaseClient(null);
      expect(statuses).toContain('offline');

      unsub();
    });

    it('broadcasts via Supabase Realtime channel when client is active', async () => {
      const mockSend = jest.fn().mockResolvedValue('ok');
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockImplementation((cb) => cb('SUBSCRIBED')),
        send: mockSend,
      };
      const mockSupabase = {
        channel: jest.fn().mockReturnValue(mockChannel),
        removeChannel: jest.fn(),
      } as any;

      service.setSupabaseClient(mockSupabase);

      const testPayload: LiveBroadcastArrivalPayload = {
        derbyCode: 'DERBY-REALTIME-2026',
        arrivalId: 'arr-rt-1',
        loftId: 'loft-01',
        loftName: 'Mistrz',
        fancierName: 'Kowalski',
        pigeonRing: 'PL-0284-24-7777',
        arrivalTime: '2026-06-14T11:15:00Z',
        distanceMeters: 382000,
        velocityMpm: 1370.5,
        timestamp: Date.now(),
      };

      const result = await service.broadcastArrival(testPayload);
      expect(result.deliveredVia).toBe('supabase_realtime');
      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'arrival',
          payload: expect.objectContaining({ pigeonRing: 'PL-0284-24-7777' }),
        })
      );
    });
  });
});

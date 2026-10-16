/**
 * PIGEON-FLY — Supabase Offline-First Delta Sync Engine
 * Handles offline queue mutations, batch flushing, and conflict resolution (LWW).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConnection } from '../db/database';

export interface SyncMutation {
  id: string;
  clientMutationId: string;
  loftId: string;
  entityName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface SyncResult {
  pushedCount: number;
  pulledCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncEngine {
  constructor(
    private db: DatabaseConnection,
    private supabase: SupabaseClient | null
  ) {}

  /**
   * Enqueues a local mutation to be synchronized with Supabase when online.
   */
  async enqueueMutation(
    loftId: string,
    entityName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    payload: Record<string, any>
  ): Promise<string> {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const clientMutationId = `cmi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO sync_queue (
        id, client_mutation_id, loft_id, entity_name, record_id, action, payload, created_at, attempts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, clientMutationId, loftId, entityName, recordId, action, JSON.stringify(payload), createdAt]
    );

    return clientMutationId;
  }

  /**
   * Retrieves pending offline mutations ordered by creation time.
   */
  async getPendingMutations(): Promise<SyncMutation[]> {
    const rows = await this.db.getAllAsync<any>(
      `SELECT * FROM sync_queue ORDER BY created_at ASC`
    );

    return rows.map((r) => ({
      id: r.id,
      clientMutationId: r.client_mutation_id,
      loftId: r.loft_id,
      entityName: r.entity_name,
      recordId: r.record_id,
      action: r.action,
      payload: JSON.parse(r.payload),
      createdAt: r.created_at,
      attempts: r.attempts,
      lastError: r.last_error || undefined,
    }));
  }

  /**
   * Synchronizes all queued mutations with Supabase.
   */
  async flushQueue(): Promise<SyncResult> {
    if (!this.supabase) {
      return { pushedCount: 0, pulledCount: 0, failedCount: 0, errors: ['Brak skonfigurowanego klienta Supabase.'] };
    }

    const mutations = await this.getPendingMutations();
    let pushedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const mutation of mutations) {
      try {
        const table = this.mapEntityToTable(mutation.entityName);
        if (!table) {
          throw new Error(`Nieznana encja: ${mutation.entityName}`);
        }

        if (mutation.action === 'INSERT' || mutation.action === 'UPDATE') {
          const { error } = await this.supabase
            .from(table)
            .upsert(mutation.payload, { onConflict: 'id' });

          if (error) throw error;
        } else if (mutation.action === 'DELETE') {
          const { error } = await this.supabase
            .from(table)
            .update({ is_deleted: true })
            .eq('id', mutation.recordId);

          if (error) throw error;
        }

        // Mutation pushed successfully, remove from local queue
        await this.db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [mutation.id]);
        pushedCount++;
      } catch (err: any) {
        failedCount++;
        const errMsg = err?.message || String(err);
        errors.push(`Błąd synchronizacji ${mutation.entityName} (${mutation.recordId}): ${errMsg}`);

        // Update retry attempt counter
        await this.db.runAsync(
          `UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?`,
          [errMsg, mutation.id]
        );
      }
    }

    return {
      pushedCount,
      pulledCount: 0,
      failedCount,
      errors,
    };
  }

  private mapEntityToTable(entity: string): string | null {
    const mapping: Record<string, string> = {
      pigeons: 'pigeons',
      races: 'races',
      arrivals: 'arrivals',
      pairings: 'pairings',
      health_logs: 'health_logs',
      moult_logs: 'moult_logs',
      lofts: 'lofts',
    };
    return mapping[entity.toLowerCase()] || null;
  }
}

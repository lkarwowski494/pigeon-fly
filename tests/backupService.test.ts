import {
  buildBackupEnvelope,
  validateBackupEnvelope,
  generateTimestampString,
  PigeonFlyBackupData,
  BACKUP_SCHEMA_VERSION,
} from '../src/services/backupService';

describe('Backup Service & Data Sovereignty', () => {
  const sampleBackupData: PigeonFlyBackupData = {
    metadata: {
      version: 1,
      appName: 'Pigeon-Fly',
      bundleId: 'com.pigeonfly.app',
      exportedAt: '2026-03-15T12:00:00.000Z',
      itemCounts: {
        lofts: 1,
        pigeons: 2,
        races: 1,
        arrivals: 1,
        clutches: 1,
        feeding_logs: 1,
        health_logs: 1,
        moult_logs: 1,
        pairings: 1,
        app_entitlements: 1,
      },
    },
    lofts: [{ id: 'loft-1', name: 'Gołębnik 1' }],
    pigeons: [
      { id: 'p1', ring_number: 'PL-0284-24-101', sex: 'cock' },
      { id: 'p2', ring_number: 'PL-0284-24-102', sex: 'hen' },
    ],
    races: [],
    arrivals: [],
    clutches: [],
    feeding_logs: [],
    health_logs: [],
    moult_logs: [],
    pairings: [],
    app_entitlements: [],
  };

  it('builds a compliant backup envelope with schema version and timestamp', () => {
    const envelope = buildBackupEnvelope(sampleBackupData);

    expect(envelope.format).toBe('pigeonfly-backup');
    expect(envelope.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(envelope.state.metadata.appName).toBe('Pigeon-Fly');
    expect(envelope.state.pigeons.length).toBe(2);
  });

  it('validates a correct backup envelope JSON string', () => {
    const envelope = buildBackupEnvelope(sampleBackupData);
    const jsonStr = JSON.stringify(envelope);

    const validation = validateBackupEnvelope(jsonStr);
    expect(validation.valid).toBe(true);
    expect(validation.data?.pigeons.length).toBe(2);
    expect(validation.error).toBeUndefined();
  });

  it('rejects corrupt or non-PigeonFly JSON files', () => {
    const invalidJson = '{"foo": "bar"}';
    const res1 = validateBackupEnvelope(invalidJson);
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain('brak sygnatury Pigeon-Fly');

    const malformedJson = '{ broken: ';
    const res2 = validateBackupEnvelope(malformedJson);
    expect(res2.valid).toBe(false);
    expect(res2.error).toContain('Błąd parsowania');
  });

  it('rejects future unsupported schema versions', () => {
    const futureData = {
      ...sampleBackupData,
      metadata: {
        ...sampleBackupData.metadata,
        version: 999,
      },
    };
    const envelope = buildBackupEnvelope(futureData as any);
    const validation = validateBackupEnvelope(JSON.stringify(envelope));

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('jest nowsza niż obsługiwana');
  });

  it('generates consistent, sortable timestamp strings for auto-backup rotation', () => {
    const fixedDate = new Date('2026-05-18T14:32:05.000Z');
    const stamp = generateTimestampString(fixedDate);

    // format: YYYY-MM-DD-HHMMSS
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}$/);
  });
});

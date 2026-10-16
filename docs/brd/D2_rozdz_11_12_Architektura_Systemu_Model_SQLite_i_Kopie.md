# Rozdziały 11–12: Architektura Systemu, Schemat DDL SQLite i Model Danych Swift (D2)
## Pigeon-Fly · Specyfikacja Architektoniczna Bazy Danych i Silnika Persystencji

---

# Rozdział 11: Architektura Systemu i Schemat Relacyjny SQLite

### 11.1. Fundament Techniczny Bazy Danych
Aplikacja wykorzystuje natywny silnik **SQLite 3** w trybie **WAL (Write-Ahead Logging)** zoptymalizowany pod kątem mikro-opóźnień zapisu i odporności na nagłe odcięcie zasilania.

```
                             ARCHITEKTURA SYSTEMU PIGEON-FLY
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           WARSTWA INTERFEJSU (UI)                          │
 │  SwiftUI 6 · Field Mode Layout · Vision QR Scanner · Apple Watch Companion  │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Obserwowane strumienie Async/Await)
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                      WARSTWA DOMENOWA (LOGIKA BIZNESOWA)                    │
 │  VincentyEngine · InbreedingCalculator · SpeedCalculator · MoultingAnalyzer │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Transakcyjne repozytoria)
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                    WARSTWA PERSYSTENCJI (LOKALNA BAZA)                      │
 │    SQLite 3 WAL Mode · Zero Partial Writes · Szyfrowany Magazyn Breloka     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │ (Darmowy Eksport 1-klik)
 ┌──────────────────────────────────────▼──────────────────────────────────────┐
 │                          KOPIA ZAPASOWA (BACKUP)                           │
 │     Prywatny iCloud Drive · Pliki Lokalne iOS · Rotacja 10 Kopii Bazy      │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

### 11.2. Kompletny Schemat DDL SQLite (Tabele, Relacje, Indeksy)

```sql
-- Włączenie kluczy obcych i trybu WAL
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

-- 1. Tabela Ustawień Gołębnika
CREATE TABLE IF NOT EXISTS loft_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Zawsze jeden rekord profilu
    loft_name TEXT NOT NULL DEFAULT 'Mój Gołębnik',
    breeder_name TEXT NOT NULL DEFAULT 'Mistrz',
    club_name TEXT,
    pzhgp_section TEXT,
    latitude REAL NOT NULL DEFAULT 52.229676,
    longitude REAL NOT NULL DEFAULT 21.012229,
    official_distance_m REAL,
    is_field_mode_enabled INTEGER NOT NULL DEFAULT 1,
    audio_chime_enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Tabela Główna Gołębi (Stado)
CREATE TABLE IF NOT EXISTS birds (
    id TEXT PRIMARY KEY, -- UUIDv4
    ring_country TEXT NOT NULL DEFAULT 'PL',
    ring_branch TEXT NOT NULL DEFAULT '0123',
    ring_year INTEGER NOT NULL,
    ring_number TEXT NOT NULL,
    auxiliary_ring_code TEXT,
    marker_color TEXT,
    sex TEXT NOT NULL CHECK (sex IN ('MALE', 'FEMALE', 'UNKNOWN')),
    color_code TEXT NOT NULL DEFAULT 'NIEBIESKA',
    status TEXT NOT NULL DEFAULT 'LOTOWY' CHECK (
        status IN ('ROZPLODOWY', 'LOTOWY', 'MLODY', 'W_GNIEZDZIE', 'SPRZEDANY', 'ZAGINIONY', 'ZSZEDL')
    ),
    sire_id TEXT, -- Klucz obcy do ojca
    dam_id TEXT,  -- Klucz obcy do matki
    compartment_name TEXT,
    nest_box_number INTEGER,
    photo_profile_path TEXT,
    photo_eye_path TEXT,
    photo_wing_path TEXT,
    eye_sign_notes TEXT,
    inbreeding_coeff REAL DEFAULT 0.0,
    structural_score INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (sire_id) REFERENCES birds(id) ON DELETE SET NULL,
    FOREIGN KEY (dam_id) REFERENCES birds(id) ON DELETE SET NULL
);

-- Indeksy unikalności i wyszukiwania stada
CREATE UNIQUE INDEX IF NOT EXISTS idx_birds_ring_unique 
    ON birds(ring_country, ring_year, ring_number);
CREATE INDEX IF NOT EXISTS idx_birds_status ON birds(status);
CREATE INDEX IF NOT EXISTS idx_birds_parents ON birds(sire_id, dam_id);
CREATE INDEX IF NOT EXISTS idx_birds_auxiliary ON birds(auxiliary_ring_code);

-- 3. Tabela Zawodów i Treningów
CREATE TABLE IF NOT EXISTS races (
    id TEXT PRIMARY KEY, -- UUIDv4
    name TEXT NOT NULL,
    race_type TEXT NOT NULL CHECK (race_type IN ('TRENING', 'ZAWODY_OFICJALNE')),
    fci_category TEXT NOT NULL DEFAULT 'A' CHECK (fci_category IN ('A', 'B', 'C', 'M', 'E', 'F')),
    release_point_name TEXT NOT NULL,
    release_latitude REAL NOT NULL,
    release_longitude REAL NOT NULL,
    release_timestamp TEXT NOT NULL, -- ISO-8601
    neutralization_start TEXT,       -- Czas zmierzchu
    neutralization_end TEXT,         -- Czas świtu
    wind_speed_kmh REAL DEFAULT 0.0,
    wind_direction_deg REAL DEFAULT 0.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Tabela Włożonych Ptaków (Koszowanie)
CREATE TABLE IF NOT EXISTS race_entries (
    id TEXT PRIMARY KEY,
    race_id TEXT NOT NULL,
    bird_id TEXT NOT NULL,
    series_order INTEGER, -- Kolejność typowania (np. 1..5)
    basketing_timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE,
    UNIQUE (race_id, bird_id)
);

-- 5. Tabela Rejestracji Przylotów i Wyników
CREATE TABLE IF NOT EXISTS race_arrivals (
    id TEXT PRIMARY KEY,
    race_id TEXT NOT NULL,
    bird_id TEXT NOT NULL,
    arrival_timestamp TEXT NOT NULL, -- Dokładność ms: 2026-06-14T11:42:18.421Z
    duration_minutes REAL NOT NULL,
    distance_meters REAL NOT NULL,
    speed_mpm REAL NOT NULL,         -- Prędkość m/min
    aero_speed_mpm REAL,             -- Prędkość skorygowana o wiatr
    coeff REAL,                      -- Oficjalny współczynnik
    arrival_source TEXT NOT NULL CHECK (arrival_source IN ('QR_CAMERA', 'APPLE_WATCH', 'MANUAL', 'BLE_IOT')),
    position_in_loft INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE,
    UNIQUE (race_id, bird_id)
);

CREATE INDEX IF NOT EXISTS idx_arrivals_race_speed 
    ON race_arrivals(race_id, speed_mpm DESC);

-- 6. Tabela Karty Pierzenia (10 Lotek Skrzydła)
CREATE TABLE IF NOT EXISTS moulting_records (
    id TEXT PRIMARY KEY,
    bird_id TEXT NOT NULL,
    recorded_date TEXT NOT NULL DEFAULT (date('now')),
    p1_state REAL NOT NULL DEFAULT 1.0, -- 1.0=Pełna, 0.75=3/4, 0.5=1/2, 0.25=1/4, 0.0=Wypadła
    p2_state REAL NOT NULL DEFAULT 1.0,
    p3_state REAL NOT NULL DEFAULT 1.0,
    p4_state REAL NOT NULL DEFAULT 1.0,
    p5_state REAL NOT NULL DEFAULT 1.0,
    p6_state REAL NOT NULL DEFAULT 1.0,
    p7_state REAL NOT NULL DEFAULT 1.0,
    p8_state REAL NOT NULL DEFAULT 1.0,
    p9_state REAL NOT NULL DEFAULT 1.0,
    p10_state REAL NOT NULL DEFAULT 1.0,
    ari_score REAL NOT NULL,            -- Aerodynamic Readiness Index (0.0 .. 1.0)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
);

-- 7. Tabela Szczepień i Profilaktyki
CREATE TABLE IF NOT EXISTS health_vaccinations (
    id TEXT PRIMARY KEY,
    bird_id TEXT, -- NULL oznacza szczepienie całego stada
    disease_type TEXT NOT NULL CHECK (disease_type IN ('PMV1', 'OSPA', 'SALMONELLA', 'INNE')),
    vaccine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    administered_date TEXT NOT NULL,
    expires_date TEXT NOT NULL,
    vet_certificate_number TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
);

-- 8. Tabela Kuracji Weterynaryjnych i Karencji Antydopingowych
CREATE TABLE IF NOT EXISTS medical_treatments (
    id TEXT PRIMARY KEY,
    bird_id TEXT, -- NULL = kuracja całego przedziału
    medication_name TEXT NOT NULL,
    active_substance TEXT NOT NULL,
    treatment_start_date TEXT NOT NULL,
    treatment_end_date TEXT NOT NULL,
    withdrawal_period_days INTEGER NOT NULL DEFAULT 0,
    withdrawal_expires_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (bird_id) REFERENCES birds(id) ON DELETE CASCADE
);
```

---

# Rozdział 12: Wzorcowy Model Danych w Języku Swift

```swift
import Foundation
import SwiftData

// MARK: - Wzorcowy Model Gołębia (Pigeon Entity)
@Model
public final class Pigeon {
    @Attribute(.unique) public var id: UUID
    public var ringCountry: String
    public var ringBranch: String
    public var ringYear: Int
    public var ringNumber: String
    public var auxiliaryRingCode: String?
    public var markerColorHex: String?
    public var sex: Sex
    public var colorCode: String
    public var status: PigeonStatus
    
    // Relacje rekurencyjne drzewa genealogicznego
    @Relationship(deleteRule: .nullify) public var sire: Pigeon?
    @Relationship(deleteRule: .nullify) public var dam: Pigeon?
    @Relationship(deleteRule: .cascade, inverse: \Pigeon.sire) public var offspringAsSire: [Pigeon]
    @Relationship(deleteRule: .cascade, inverse: \Pigeon.dam) public var offspringAsDam: [Pigeon]
    
    // Zdjęcia i multimedia
    public var photoProfilePath: String?
    public var photoEyePath: String?
    public var photoWingPath: String?
    
    // Wskaźniki dziedzinowe
    public var inbreedingCoefficient: Double
    public var structuralScore: Int
    public var createdAt: Date
    public var updatedAt: Date
    
    public init(
        id: UUID = UUID(),
        ringCountry: String = "PL",
        ringBranch: String = "0123",
        ringYear: Int = 2026,
        ringNumber: String,
        sex: Sex = .male,
        colorCode: String = "NIEBIESKA",
        status: PigeonStatus = .racing
    ) {
        self.id = id
        self.ringCountry = ringCountry
        self.ringBranch = ringBranch
        self.ringYear = ringYear
        self.ringNumber = ringNumber
        self.sex = sex
        self.colorCode = colorCode
        self.status = status
        self.inbreedingCoefficient = 0.0
        self.structuralScore = 0
        self.offspringAsSire = []
        self.offspringAsDam = []
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    public var fullRingIdentifier: String {
        "\(ringCountry)-\(ringBranch)-\(ringYear % 100)-\(ringNumber)"
    }
}

public enum Sex: String, Codable {
    case male = "MALE"
    case female = "FEMALE"
    case unknown = "UNKNOWN"
}

public enum PigeonStatus: String, Codable {
    case breeding = "ROZPLODOWY"
    case racing = "LOTOWY"
    case young = "MLODY"
    case inNest = "W_GNIEZDZIE"
    case sold = "SPRZEDANY"
    case lost = "ZAGINIONY"
    case deceased = "ZSZEDL"
}

// MARK: - Wzorcowy Model Rejestracji Przylotu i Prędkości (Arrival Entity)
@Model
public final class RaceArrival {
    @Attribute(.unique) public var id: UUID
    public var raceId: UUID
    public var pigeonId: UUID
    public var arrivalTimestamp: Date
    public var durationMinutes: Double
    public var distanceMeters: Double
    public var speedMpm: Double
    public var aeroSpeedMpm: Double?
    public var positionInLoft: Int
    public var source: ArrivalSource
    public var createdAt: Date
    
    public init(
        id: UUID = UUID(),
        raceId: UUID,
        pigeonId: UUID,
        arrivalTimestamp: Date,
        durationMinutes: Double,
        distanceMeters: Double,
        positionInLoft: Int,
        source: ArrivalSource = .qrCamera
    ) {
        self.id = id
        self.raceId = raceId
        self.pigeonId = pigeonId
        self.arrivalTimestamp = arrivalTimestamp
        self.durationMinutes = durationMinutes
        self.distanceMeters = distanceMeters
        self.positionInLoft = positionInLoft
        self.source = source
        self.speedMpm = durationMinutes > 0 ? (distanceMeters / durationMinutes) : 0.0
        self.createdAt = Date()
    }
}

public enum ArrivalSource: String, Codable {
    case qrCamera = "QR_CAMERA"
    case appleWatch = "APPLE_WATCH"
    case manual = "MANUAL"
    case bleIot = "BLE_IOT"
}
```

---

### 11.3. Procedura Automatycznego i Manualnego Backupu
- **Kopia Rotacyjna (10 Slotów):** Przy każdym uruchomieniu aplikacji po wykryciu zakończenia lotu lub dodania nowych ptaków silnik wykonuje:
  ```
  /Library/Application Support/Backups/PigeonFly_backup_0.sqlite ... PigeonFly_backup_9.sqlite
  ```
  Nowa kopia nadpisuje najstarszą w pętli FIFO.
- **Eksport do Chmury Użytkownika:** 1-klikowy eksport pliku `.sqlite` i `.json` przez standardowy `UIActivityViewController` do wybranego folderu w iCloud Drive lub pamięci urządzenia. Kopia nigdy nie wymaga płatnej subskrypcji.

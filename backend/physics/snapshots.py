"""
Sistema de snapshots y exportación para reproducibilidad científica.

Engine Spec v6.0 §11 (Replay + Reproducibility).
"""

from __future__ import annotations

import json
import struct
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import xxhash

from .constants import SOLVER_VERSION


@dataclass
class SimulationSnapshot:
    """Snapshot canónico de una simulación."""
    wave_hash: str
    parameters: dict
    solver_state: dict
    checksum: str
    timestamp: str
    seed: int
    build_hash: str
    browser_info: str
    solver_version: str
    normalization: float


def hash_wavefunction(psi: np.ndarray) -> str:
    """XXHash64 del array serializado en Float64.

    Nota: psi debe ser un array real (float64). Arrays complejos se
    convertirán a su parte real para evitar TypeError.
    """
    if np.iscomplexobj(psi):
        psi = np.real(psi)
    return xxhash.xxh64(psi.astype(np.float64).tobytes()).hexdigest()


def hash_snapshot(snapshot: dict) -> str:
    """Checksum XXHash64 del snapshot completo (excluye campo 'checksum')."""
    data = {k: v for k, v in snapshot.items() if k != "checksum"}
    return xxhash.xxh64(json.dumps(data, sort_keys=True).encode()).hexdigest()


def create_snapshot(
    psi: np.ndarray,
    parameters: dict,
    solver_state: dict,
    build_hash: str,
    solver_version: str = SOLVER_VERSION,
    browser_info: str = "backend",
) -> SimulationSnapshot:
    """Crea un snapshot completo con checksum."""
    wave_hash = hash_wavefunction(psi)
    normalization = float(np.sum(np.abs(psi) ** 2))

    raw = {
        "wave_hash": wave_hash,
        "parameters": parameters,
        "solver_state": solver_state,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "seed": 0,  # simulaciones determinísticas
        "build_hash": build_hash,
        "browser_info": browser_info,
        "solver_version": solver_version,
        "normalization": normalization,
    }
    raw["checksum"] = hash_snapshot(raw)

    return SimulationSnapshot(**raw)


def export_csv(t: list[float], S1: list[float]) -> str:
    """Exporta datos como CSV con headers canónicos."""
    lines = ["t_us,S1_um"]
    lines.extend(f"{ti:.6f},{si:.8e}" for ti, si in zip(t, S1))
    return "\n".join(lines)


def export_json(
    t: list[float],
    S1: list[float],
    snapshot: SimulationSnapshot,
    metadata: Optional[dict] = None,
) -> dict:
    """Exporta datos como JSON con metadata completa."""
    result = {
        "metadata": asdict(snapshot),
        "data": {"t": t, "S1": S1},
    }
    if metadata:
        result["metadata"]["extra"] = metadata
    return result


def export_msgpack(
    t: list[float],
    S1: list[float],
    snapshot: SimulationSnapshot,
) -> bytes:
    """Exporta datos como MessagePack (rápido para runtime)."""
    try:
        import msgpack
        data = export_json(t, S1, snapshot)
        return msgpack.packb(data, use_bin_type=True)
    except ImportError:
        # Fallback a JSON binario si msgpack no está disponible
        return json.dumps(export_json(t, S1, snapshot)).encode()


def export_binary_replay(
    t: list[float],
    S1: list[float],
    snapshot: SimulationSnapshot,
) -> bytes:
    """
    Exporta formato binario de replay para reproducibilidad exacta.

    Formato:
      [header 32B][snapshot JSON][t array Float64][S1 array Float64]
    """
    snapshot_bytes = json.dumps(asdict(snapshot), sort_keys=True).encode()
    t_arr = np.array(t, dtype=np.float64)
    S1_arr = np.array(S1, dtype=np.float64)
    t_bytes = t_arr.tobytes()
    S1_bytes = S1_arr.tobytes()

    header = struct.pack(
        ">8sQQQ",
        b"ZBWREPLY",
        len(snapshot_bytes),
        len(t_bytes),
        len(S1_bytes),
    )

    return header + snapshot_bytes + t_bytes + S1_bytes


def import_binary_replay(data: bytes) -> tuple[dict, np.ndarray, np.ndarray]:
    """Importa un replay binario. Retorna (snapshot_dict, t_arr, S1_arr)."""
    if len(data) < 32:
        raise ValueError("Replay file too short (minimum 32 bytes header)")

    header_size = struct.calcsize(">8sQQQ")
    magic, snap_len, t_len, s1_len = struct.unpack(">8sQQQ", data[:header_size])

    if magic != b"ZBWREPLY":
        raise ValueError("Invalid replay file magic bytes")

    # Bounds check: verify data is large enough for all declared sections
    total_expected = header_size + snap_len + t_len + s1_len
    if total_expected > len(data):
        raise ValueError(
            f"Replay file truncated: expected {total_expected} bytes, got {len(data)}"
        )

    offset = header_size
    snapshot_bytes = data[offset:offset + snap_len]
    offset += snap_len
    t_bytes = data[offset:offset + t_len]
    offset += t_len
    s1_bytes = data[offset:offset + s1_len]

    snapshot = json.loads(snapshot_bytes.decode())
    t_arr = np.frombuffer(t_bytes, dtype=np.float64)
    S1_arr = np.frombuffer(s1_bytes, dtype=np.float64)

    return snapshot, t_arr, S1_arr

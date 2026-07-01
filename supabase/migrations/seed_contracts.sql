-- ============================================
-- Seeding Emergency Contracts Data
-- ============================================

INSERT INTO emergency_contracts (contract_id, contract_number, object_description, start_date, end_date, total_value, status, synced)
VALUES
  ('CTR-SEED-001', '2025-1V6400', 'Filtros', '2025-06-19', '2026-06-18', 18250.00, 'active', true),
  ('CTR-SEED-002', '2025-XVC15', 'Cestas Básicas', '2025-06-02', '2026-06-01', 210600.00, 'active', true),
  ('CTR-SEED-003', '2025-9J0PF', 'Cestas de Limpeza', '2025-06-02', '2026-06-01', 31122.00, 'active', true),
  ('CTR-SEED-004', '2025-VW0H6', 'Colchões', '2025-06-02', '2026-06-05', 41660.00, 'active', true),
  ('CTR-SEED-005', '2025-LXCTX', 'Mantas', '2025-06-10', '2026-06-09', 12975.00, 'active', true),
  ('CTR-SEED-006', '2025-LXSOQ', 'Higiene e Limpeza', '2025-08-15', '2026-08-15', 1138.00, 'active', true),
  ('CTR-SEED-007', '2025-L1F26', 'Marmitas', '2025-09-25', '2026-09-24', 2756.80, 'active', true)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_number = EXCLUDED.contract_number,
  object_description = EXCLUDED.object_description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  total_value = EXCLUDED.total_value;

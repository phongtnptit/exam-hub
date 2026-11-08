-- Add missing storage without deleting existing rows.
ALTER TABLE exam_attempts
  ADD COLUMN activeKey VARCHAR(100) NULL,
  ADD COLUMN answers JSON NULL,
  ADD COLUMN questionSnapshot JSON NULL;
ALTER TABLE results ADD COLUMN attemptId INTEGER NULL;
CREATE UNIQUE INDEX exam_attempts_activeKey_key ON exam_attempts(activeKey);
CREATE UNIQUE INDEX results_attemptId_key ON results(attemptId);
ALTER TABLE results ADD CONSTRAINT results_attemptId_fkey
  FOREIGN KEY (attemptId) REFERENCES exam_attempts(id) ON DELETE SET NULL ON UPDATE CASCADE;
-- Legacy attempts/results remain untouched. Do not invent historical snapshots.

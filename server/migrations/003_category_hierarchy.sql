SET @parent_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categories'
    AND COLUMN_NAME = 'parent_category_id'
);

SET @sql := IF(
  @parent_col_exists = 0,
  'ALTER TABLE categories ADD COLUMN parent_category_id INT NULL AFTER slug',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @parent_idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categories'
    AND INDEX_NAME = 'idx_categories_parent_category_id'
);

SET @sql := IF(
  @parent_idx_exists = 0,
  'CREATE INDEX idx_categories_parent_category_id ON categories(parent_category_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @parent_fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'categories'
    AND CONSTRAINT_NAME = 'fk_categories_parent_category'
);

SET @sql := IF(
  @parent_fk_exists = 0,
  'ALTER TABLE categories ADD CONSTRAINT fk_categories_parent_category FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
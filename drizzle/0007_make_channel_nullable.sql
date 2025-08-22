BEGIN;

-- Make channel_id nullable on chats, customers, orders and set FK to ON DELETE SET NULL
ALTER TABLE chats ALTER COLUMN channel_id DROP NOT NULL;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_channel_id_connected_channels_channel_id_fk;
ALTER TABLE chats
  ADD CONSTRAINT chats_channel_id_connected_channels_channel_id_fk
  FOREIGN KEY (channel_id) REFERENCES connected_channels(channel_id) ON DELETE SET NULL;

ALTER TABLE customers ALTER COLUMN channel_id DROP NOT NULL;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_channel_id_connected_channels_channel_id_fk;
ALTER TABLE customers
  ADD CONSTRAINT customers_channel_id_connected_channels_channel_id_fk
  FOREIGN KEY (channel_id) REFERENCES connected_channels(channel_id) ON DELETE SET NULL;

ALTER TABLE orders ALTER COLUMN channel_id DROP NOT NULL;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_channel_id_connected_channels_channel_id_fk;
ALTER TABLE orders
  ADD CONSTRAINT orders_channel_id_connected_channels_channel_id_fk
  FOREIGN KEY (channel_id) REFERENCES connected_channels(channel_id) ON DELETE SET NULL;

COMMIT;

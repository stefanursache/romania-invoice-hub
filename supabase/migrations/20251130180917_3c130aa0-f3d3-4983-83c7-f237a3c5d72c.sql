-- Add unique constraint to payment_gateway_config to prevent duplicates
ALTER TABLE payment_gateway_config
ADD CONSTRAINT payment_gateway_config_gateway_name_unique UNIQUE (gateway_name);
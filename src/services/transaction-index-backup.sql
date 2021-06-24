CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION pg_trgm;
CREATE EXTENSION pgcrypto;

DROP FUNCTION generate_decryption_col;

CREATE FUNCTION generate_decryption_col (IN accValue VARCHAR, IN ob_key VARCHAR)
	RETURNS text
	LANGUAGE plpgsql
	STRICT IMMUTABLE
	AS $$
DECLARE
	output TEXT = '';
BEGIN
	output := convert_from(decrypt(CAST($1 AS bytea), decode($2, 'hex'), 'aes-ecb'), 'UTF8')::VARCHAR;
	RETURN output;
END;
$$;

CREATE FUNCTION get_random_string (IN string_length INTEGER, IN possible_chars TEXT DEFAULT 'abcdefghijklmnopqrstuvwxyz')
	RETURNS text
	LANGUAGE plpgsql
	AS $$
DECLARE
	output TEXT = '';
	i INT4;
	pos INT4;
BEGIN
	FOR i IN 1..string_length LOOP
		pos := 1 + CAST(random() * (LENGTH(possible_chars) - 1) AS INT4);
		output := output || substr(possible_chars, pos, 1);
	END LOOP;
	RETURN output;
END;
$$;

DROP FUNCTION func_multiselect_transaction;

CREATE OR REPLACE FUNCTION func_multiselect_transaction(
	IN fp_ref TEXT DEFAULT NULL,
	IN ob_key TEXT DEFAULT NULL) 
RETURNS TABLE(id BIGINT, 
	transaction_reference VARCHAR, 
	datez CHAR(8), 
	timez CHAR(8), 
	type CHAR(1), 
	sender_main_account_value TEXT,
	sender_sub_account_value TEXT,
	receiver_main_account_value TEXT,
	receiver_sub_account_value TEXT
) AS
$func$
DECLARE 
    sql1 TEXT;
	sql2 TEXT;
	isMultiCase BOOLEAN;
BEGIN

	sql1 = 'SELECT ';
	sql1 := sql1 || 'id,';
	sql1 := sql1 || 'transaction_reference,';
	sql1 := sql1 || 'date,';
	sql1 := sql1 || 'time,';
	sql1 := sql1 || 'type,';
	sql1 := sql1 || 'generate_decryption_col(sender_main_account_value, ' || quote_literal($2) || ') AS sender_main_account_value,';
	sql1 := sql1 || 'generate_decryption_col(sender_sub_account_value, ' || quote_literal($2) || ') AS sender_sub_account_value,';
	sql1 := sql1 || 'generate_decryption_col(receiver_main_account_value, ' || quote_literal($2) || ') AS receiver_main_account_value,';
	sql1 := sql1 || 'generate_decryption_col(receiver_sub_account_value, ' || quote_literal($2) || ') AS receiver_sub_account_value ';
	sql1 := sql1 || ' FROM transaction_financial';
	sql1 := sql1 || ' WHERE	generate_decryption_col(sender_main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(sender_sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(receiver_main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(receiver_sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');

	sql2 = 'SELECT ';
	sql2 := sql2 || 'id,';
	sql2 := sql2 || 'transaction_reference,';
	sql2 := sql2 || 'date,';
	sql2 := sql2 || 'time,';
	sql2 := sql2 || 'type,';
	sql2 := sql2 || 'generate_decryption_col(main_account_value, ' || quote_literal($2) || ') AS main_account_value,';
	sql2 := sql2 || 'generate_decryption_col(sub_account_value, ' || quote_literal($2) || ') AS sub_account_value,';
	sql2 := sql2 || 'NULL AS receiver_main_account_value,';
	sql2 := sql2 || 'NULL AS receiver_sub_account_value ';
	sql2 := sql2 || 'FROM transaction_nonfinancial';
	sql2 := sql2 || ' WHERE	generate_decryption_col(main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql2 := sql2 || ' OR generate_decryption_col(sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');

	RETURN QUERY EXECUTE sql1::TEXT;
	RETURN QUERY EXECUTE sql2::TEXT;
	
END
$func$ LANGUAGE plpgsql;

SELECT
	*
FROM
	func_multiselect_transaction ('66150',
		'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415')
ORDER BY datez
LIMIT 2500;


CREATE TABLE transaction_financial (
	id BIGSERIAL PRIMARY KEY,
	transaction_reference varchar(20),
	date bpchar(8),
	time bpchar(8),
	sender_name text,
	sender_main_account_value varchar(255),
	sender_sub_account_value varchar(255),
	receiver_main_account_value varchar(255),
	receiver_sub_account_value varchar(255),
	partner_name text
);

CREATE TABLE transaction_nonfinancial (
	id BIGSERIAL PRIMARY KEY,
	transaction_reference varchar(20),
	date bpchar(8),
	time bpchar(8),
	sender_name text,
	main_account_value varchar(255),
	sub_account_value varchar(255)
);

ALTER TABLE transaction_financial
ADD type CHAR(1) DEFAULT 'F';

ALTER TABLE transaction_nonfinancial
ADD type CHAR(1) DEFAULT 'N';

DO $$
BEGIN
	FOR r IN 0..2000000 LOOP
		INSERT INTO transaction_financial (transaction_reference, date, time, sender_name, sender_main_account_value, sender_sub_account_value, receiver_main_account_value, receiver_sub_account_value, partner_name)
			values('FP' || get_random_string (8, '0123456789'), get_random_string (6, '0123456789'), get_random_string (6, '0123456789'), get_random_string (8), encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR, encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR, encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR, encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR, concat_ws('@', substring(md5(random()::text), 0, 9), 'gmailcom'));
	END LOOP;
END
$$;

DO $$
BEGIN
	FOR r IN 0..1000000 LOOP
		INSERT INTO transaction_nonfinancial (transaction_reference, date, time, sender_name, main_account_value, sub_account_value)
			values('FP' || get_random_string (8, '0123456789'), get_random_string (6, '0123456789'), get_random_string (6, '0123456789'), get_random_string (8), encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR, encrypt(CAST(get_random_string (18, '0123456789') AS bytea), decode('fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415', 'hex'), 'aes-ecb')::VARCHAR);
	END LOOP;
END
$$;



SELECT 
	id,
	transaction_reference,
	date,
	time,
	generate_decryption_col(sender_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS sender_main_account_value,
	generate_decryption_col(sender_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS sender_sub_account_value,
	generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS receiver_main_account_value,
	generate_decryption_col(receiver_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS receiver_sub_account_value
FROM
	transaction_financial
WHERE 
	generate_decryption_col(sender_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%1234%'
OR
	generate_decryption_col(sender_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%1234%'
OR
	generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%1234%'
OR
	generate_decryption_col(receiver_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%1234%'
LIMIT 2500;

DROP INDEX indx_transaction_financial_sender_main;
CREATE INDEX indx_transaction_financial_account_no ON transaction_financial 
USING GIN (
	generate_decryption_col(sender_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops,
	generate_decryption_col(sender_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops,
	generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops,
	generate_decryption_col(receiver_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
);

DROP INDEX indx_transaction_financial_sender_main_account;
CREATE INDEX indx_transaction_financial_sender_main_account ON transaction_financial 
USING GIN (
-- 	generate_decryption_col(sender_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
sender_main_account_value gin_trgm_ops
);

DROP INDEX indx_transaction_financial_sender_sub_account;
CREATE INDEX indx_transaction_financial_sender_sub_account ON transaction_financial 
USING GIN (
-- 	generate_decryption_col(sender_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
	sender_sub_account_value gin_trgm_ops
);

DROP INDEX indx_transaction_financial_receiver_main_account;
CREATE INDEX indx_transaction_financial_receiver_main_account ON transaction_financial 
USING GIN (
-- 	generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
	receiver_main_account_value gin_trgm_ops
);

DROP INDEX indx_transaction_financial_receiver_sub_account;
CREATE INDEX indx_transaction_financial_receiver_sub_account ON transaction_financial 
USING GIN (
-- 	generate_decryption_col(receiver_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
	receiver_sub_account_value gin_trgm_ops
);

CREATE INDEX idx_transaction_financial_gist ON transaction_financial USING GiST(generate_decryption_col(sender_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gist_trgm_ops, generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gist_trgm_ops);  -- geometry type
CREATE INDEX idx_transaction_financial_gin  ON transaction_financial USING GIN(generate_decryption_col(sender_sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops, generate_decryption_col(receiver_main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops);

SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes WHERE relname = 'transaction_financial';

SELECT COUNT(id) FROM tbl_transaction;

DROP INDEX indx_transaction_nonfinancial_account_no;
CREATE INDEX indx_transaction_nonfinancial_account_no ON transaction_nonfinancial 
USING GIN (
	generate_decryption_col(main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops,
	generate_decryption_col(sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') gin_trgm_ops
);

SELECT 
	id,
	transaction_reference,
	date,
	time,
	type,
	generate_decryption_col(main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS main_account_value,
	generate_decryption_col(sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') AS sub_account_value
FROM
	transaction_nonfinancial
WHERE 
	generate_decryption_col(main_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%123%'
OR
	generate_decryption_col(sub_account_value, 'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415') LIKE '%123%'
LIMIT 2500;


CREATE OR REPLACE FUNCTION func_multiselect_transaction_clone(
	IN fp_ref TEXT DEFAULT NULL,
	IN ob_key TEXT DEFAULT NULL) 
RETURNS TABLE(id BIGINT, 
	transaction_reference VARCHAR, 
	datez CHAR(8), 
	timez CHAR(8), 
	type CHAR(1), 
	sender_main_account_value TEXT,
	sender_sub_account_value TEXT,
	receiver_main_account_value TEXT,
	receiver_sub_account_value TEXT
) AS
$func$
DECLARE 
    sql1 TEXT;
	sql2 TEXT;
	isMultiCase BOOLEAN;
BEGIN

	sql1 = 'SELECT ';
	sql1 := sql1 || 'id,';
	sql1 := sql1 || 'transaction_reference,';
	sql1 := sql1 || 'date,';
	sql1 := sql1 || 'time,';
	sql1 := sql1 || 'type,';
	sql1 := sql1 || 'generate_decryption_col(sender_main_account_value, ' || quote_literal($2) || ') AS sender_main_account_value,';
	sql1 := sql1 || 'generate_decryption_col(sender_sub_account_value, ' || quote_literal($2) || ') AS sender_sub_account_value,';
	sql1 := sql1 || 'generate_decryption_col(receiver_main_account_value, ' || quote_literal($2) || ') AS receiver_main_account_value,';
	sql1 := sql1 || 'generate_decryption_col(receiver_sub_account_value, ' || quote_literal($2) || ') AS receiver_sub_account_value ';
	sql1 := sql1 || ' FROM transaction_financial_clone';
	sql1 := sql1 || ' WHERE	generate_decryption_col(sender_main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(sender_sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(receiver_main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql1 := sql1 || ' OR generate_decryption_col(receiver_sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');

	sql2 = 'SELECT ';
	sql2 := sql2 || 'id,';
	sql2 := sql2 || 'transaction_reference,';
	sql2 := sql2 || 'date,';
	sql2 := sql2 || 'time,';
	sql2 := sql2 || 'type,';
	sql2 := sql2 || 'generate_decryption_col(main_account_value, ' || quote_literal($2) || ') AS main_account_value,';
	sql2 := sql2 || 'generate_decryption_col(sub_account_value, ' || quote_literal($2) || ') AS sub_account_value,';
	sql2 := sql2 || 'NULL AS receiver_main_account_value,';
	sql2 := sql2 || 'NULL AS receiver_sub_account_value ';
	sql2 := sql2 || 'FROM transaction_nonfinancial_clone';
	sql2 := sql2 || ' WHERE	generate_decryption_col(main_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');
	sql2 := sql2 || ' OR generate_decryption_col(sub_account_value, ' || quote_literal($2) || ') LIKE ' || quote_literal('%' || $1 || '%');

	RETURN QUERY EXECUTE sql1::TEXT;
	RETURN QUERY EXECUTE sql2::TEXT;
	
END
$func$ LANGUAGE plpgsql;

SELECT
	*
FROM
	func_multiselect_transaction_clone ('66150',
		'fbe92bfa504ee42dc39ea2df0fba5b0695280f11b921a637ad4d480281e6a415')
ORDER BY datez
LIMIT 2500;

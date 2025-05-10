create trigger on insert
    on table_name
    for each row
    begin
        -- Trigger logic here
        -- Example: Insert a log entry into a log table
        insert into log_table (log_message, created_at)
        values ('New row inserted', now());
    end;
alter table shared_history add column if not exists pin text not null default '';

create index if not exists shared_history_pin_sent_idx on shared_history (pin, sent_at desc);

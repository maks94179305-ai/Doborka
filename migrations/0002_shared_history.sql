create table if not exists shared_history (
  id text primary key,
  photo_id text not null,
  title text not null,
  color_name text,
  sent_at bigint not null,
  image text not null default ''
);

create index if not exists shared_history_sent_at_idx on shared_history (sent_at desc);

create table if not exists shared_project (
  id text primary key,
  payload text not null,
  updated_at bigint not null
);

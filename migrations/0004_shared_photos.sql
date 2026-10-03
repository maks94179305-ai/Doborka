create table if not exists shared_photo (
  pin text not null,
  id text not null,
  image text not null,
  updated_at bigint not null,
  primary key (pin, id)
);

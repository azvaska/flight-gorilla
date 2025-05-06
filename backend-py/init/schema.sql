create type classtype as enum ('FIRST_CLASS', 'BUSINESS_CLASS', 'ECONOMY_CLASS');

alter type classtype owner to postgres;

create table nation
(
    id     serial
        constraint pk_nation
            primary key,
    name   varchar(255) not null,
    code   varchar(255) not null,
    alpha2 varchar(2)   not null
);

alter table nation
    owner to postgres;

create table aircraft
(
    id                serial
        constraint pk_aircraft
            primary key,
    name              varchar             not null,
    rows              integer             not null,
    columns           integer             not null,
    unavailable_seats character varying[] not null
);

alter table aircraft
    owner to postgres;

create table city
(
    id        serial
        constraint pk_city
            primary key,
    name      varchar(255) not null,
    nation_id integer
        constraint fk_city_nation_id_nation
            references nation
);

alter table city
    owner to postgres;

create table airline
(
    id                         uuid         not null
        constraint pk_airline
            primary key,
    name                       varchar(255) not null,
    address                    varchar(255) not null,
    zip                        varchar(255) not null,
    nation_id                  integer      not null
        constraint fk_airline_nation_id_nation
            references nation,
    email                      varchar(255) not null,
    website                    varchar(255) not null,
    is_approved                boolean      not null,
    first_class_description    text         not null,
    business_class_description text         not null,
    economy_class_description  text         not null
);

alter table airline
    owner to postgres;

create table debit_card
(
    id                     serial
        constraint pk_debit_card
            primary key,
    user_id                uuid         not null,
    last_4_card            varchar(255) not null,
    credit_card_expiration varchar(255) not null,
    circuits               varchar(255) not null
);

alter table debit_card
    owner to postgres;

create table airline_aircraft
(
    id                   uuid                not null
        constraint pk_airline_aircraft
            primary key,
    aircraft_id          integer             not null
        constraint fk_airline_aircraft_aircraft_id_aircraft
            references aircraft,
    airlines_id          uuid                not null
        constraint fk_airline_aircraft_airlines_id_airline
            references airline,
    first_class_seats    character varying[] not null,
    business_class_seats character varying[] not null,
    economy_class_seats  character varying[] not null,
    tail_number          varchar(255)        not null
);

alter table airline_aircraft
    owner to postgres;

create table extra
(
    id          uuid         not null
        constraint pk_extra
            primary key,
    name        varchar(255) not null,
    description varchar(255) not null,
    airline_id  uuid         not null
        constraint fk_extra_airline_id_airline
            references airline,
    all_flights boolean      not null,
    stackable   boolean      not null
);

alter table extra
    owner to postgres;

create table airport
(
    id        serial
        constraint pk_airport
            primary key,
    name      varchar(255)     not null,
    iata_code varchar(3),
    icao_code varchar(4),
    latitude  double precision not null,
    longitude double precision not null,
    city_id   integer          not null
        constraint fk_airport_city_id_city
            references city
);

alter table airport
    owner to postgres;

create table booking
(
    id                    uuid    not null
        constraint pk_booking
            primary key,
    user_id               uuid    not null,
    departure_checkin     timestamp,
    arrival_checkin       timestamp,
    has_booking_insurance boolean not null
);

alter table booking
    owner to postgres;

create table flight
(
    id                   uuid             not null
        constraint pk_flight
            primary key,
    airline_id           uuid             not null
        constraint fk_flight_airline_id_airline
            references airline,
    aircraft_id          integer          not null
        constraint fk_flight_aircraft_id_aircraft
            references aircraft,
    departure_airport_id integer          not null
        constraint fk_flight_departure_airport_id_airport
            references airport,
    arrival_airport_id   integer          not null
        constraint fk_flight_arrival_airport_id_airport
            references airport,
    departure_time       timestamp        not null,
    arrival_time         timestamp        not null,
    checkin_start_time   timestamp        not null,
    checkin_end_time     timestamp        not null,
    boarding_start_time  timestamp        not null,
    boarding_end_time    timestamp        not null,
    flight_number        varchar(255)     not null,
    gate                 varchar(255),
    terminal             varchar(255),
    price_first_class    double precision not null,
    price_business_class double precision not null,
    price_economy_class  double precision not null,
    price_insurance      double precision not null
);

alter table flight
    owner to postgres;

create table flight_extras
(
    flight_id uuid             not null
        constraint fk_flight_extras_flight_id_flight
            references flight,
    extra_id  uuid             not null
        constraint fk_flight_extras_extra_id_extra
            references extra,
    price     double precision not null,
    constraint pk_flight_extras
        primary key (flight_id, extra_id)
);

alter table flight_extras
    owner to postgres;

create table flight_extra_flight
(
    flight_id uuid             not null
        constraint fk_flight_extra_flight_flight_id_flight
            references flight,
    extra_id  uuid             not null
        constraint fk_flight_extra_flight_extra_id_extra
            references extra,
    price     double precision not null,
    constraint pk_flight_extra_flight
        primary key (flight_id, extra_id)
);

alter table flight_extra_flight
    owner to postgres;

create table booking_flight_departure
(
    book_id     uuid      not null
        constraint fk_booking_flight_departure_book_id_booking
            references booking,
    seat_number varchar   not null,
    class_type  classtype not null,
    flight_id   uuid      not null
        constraint fk_booking_flight_departure_flight_id_flight
            references flight,
    constraint pk_booking_flight_departure
        primary key (book_id, flight_id)
);

alter table booking_flight_departure
    owner to postgres;

create table booking_flight_arrival
(
    book_id     uuid      not null
        constraint fk_booking_flight_arrival_book_id_booking
            references booking,
    seat_number varchar   not null,
    class_type  classtype not null,
    flight_id   uuid      not null
        constraint fk_booking_flight_arrival_flight_id_flight
            references flight,
    constraint pk_booking_flight_arrival
        primary key (book_id, flight_id)
);

alter table booking_flight_arrival
    owner to postgres;

create table seat_session
(
    id                 uuid      not null
        constraint pk_seat_session
            primary key,
    user_id            uuid      not null,
    flight_id          uuid      not null
        constraint fk_seat_session_flight_id_flight
            references flight,
    session_start_time timestamp not null,
    session_end_time   timestamp not null
);

alter table seat_session
    owner to postgres;

create table reserved_seat
(
    id          uuid         not null
        constraint pk_reserved_seat
            primary key,
    session_id  uuid         not null
        constraint fk_reserved_seat_session_id_seat_session
            references seat_session,
    seat_number varchar(255) not null
);

alter table reserved_seat
    owner to postgres;

create table role
(
    id              serial
        constraint pk_role
            primary key,
    name            varchar(80)             not null
        constraint uq_role_name
            unique,
    description     varchar(255),
    permissions     text,
    update_datetime timestamp default now() not null
);

alter table role
    owner to postgres;

create table "user"
(
    id                      uuid                    not null
        constraint pk_user
            primary key,
    email                   varchar(255)            not null,
    password                varchar(255)            not null,
    name                    varchar(255)            not null,
    surname                 varchar(255)            not null,
    address                 varchar(255),
    zip                     varchar(255),
    nation_id               integer
        constraint fk_user_nation_id_nation
            references nation,
    username                varchar(255)
        constraint uq_user_username
            unique,
    active                  boolean                 not null,
    fs_uniquifier           varchar(64)             not null
        constraint uq_user_fs_uniquifier
            unique,
    confirmed_at            timestamp,
    last_login_at           timestamp,
    current_login_at        timestamp,
    last_login_ip           varchar(64),
    current_login_ip        varchar(64),
    login_count             integer,
    tf_primary_method       varchar(64),
    tf_totp_secret          varchar(255),
    tf_phone_number         varchar(128),
    us_totp_secrets         text,
    us_phone_number         varchar(128)
        constraint uq_user_us_phone_number
            unique,
    fs_webauthn_user_handle varchar(64)
        constraint uq_user_fs_webauthn_user_handle
            unique,
    mf_recovery_codes       text,
    create_datetime         timestamp default now() not null,
    update_datetime         timestamp default now() not null
);

alter table "user"
    owner to postgres;

create table roles_users
(
    user_id uuid    not null
        constraint fk_roles_users_user_id_user
            references "user",
    role_id integer not null
        constraint fk_roles_users_role_id_role
            references role,
    constraint pk_roles_users
        primary key (user_id, role_id)
);

alter table roles_users
    owner to postgres;


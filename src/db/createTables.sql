CREATE DATABASE rewear;
USE rewear;

CREATE TABLE user (
  id int PRIMARY KEY NOT NULL auto_increment,
  username VARCHAR(50) NOT NULL,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  phone varchar(15) NOT NULL,
  registration_date date NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  password char(255) NOT NULL
);

CREATE TABLE product (
  id int PRIMARY KEY NOT NULL auto_increment,
  seller_id int NOT NULL,
  name varchar(50) NOT NULL,
  brand varchar(50),
  category varchar(50) NOT NULL,
  color varchar(50) NOT NULL,
  status enum('available','out_of_stock') NOT NULL DEFAULT 'available',
  price decimal(10,2) NOT NULL,
  publication_date date NOT NULL,
  #payment_details varchar(255) NOT NULL, //ya esta ubicada en payment_method
  publication_status enum('draft','published','archived')
);

CREATE TABLE reviews (
  id int PRIMARY KEY NOT NULL auto_increment,
  product_id int NOT NULL,
  user_id int NOT NULL,
  comment varchar(400),
  rating int NOT NULL,
  comment_date date NOT NULL
);

CREATE TABLE transaction (
  id int PRIMARY KEY NOT NULL auto_increment,
  product_id int NOT NULL,
  buyer_id int NOT NULL,
  transaction_date date NOT NULL,
  payment_method varchar(50) NOT NULL,
  total_amount int NOT NULL,
  transaction_status enum('pending','completed','cancelled')
);

CREATE TABLE payment_method (
  id int PRIMARY KEY NOT NULL auto_increment,
  user_id int NOT NULL,
  payment_type enum('credit_card','paypal','bank_transfer') NOT NULL,
  payment_details text NOT NULL
);

CREATE TABLE product_image (
  id int PRIMARY KEY NOT NULL auto_increment,
  image_id varchar(255) NOT NULL,
  product_id int NOT NULL,
  image_url varchar(255) NOT NULL
);

ALTER TABLE PRODUCT ADD FOREIGN KEY (seller_id) REFERENCES USER (id);

ALTER TABLE reviews ADD FOREIGN KEY (product_id) REFERENCES PRODUCT (id);

ALTER TABLE reviews ADD FOREIGN KEY (user_id) REFERENCES USER (id);

ALTER TABLE transaction ADD FOREIGN KEY (product_id) REFERENCES PRODUCT (id);

ALTER TABLE transaction ADD FOREIGN KEY (buyer_id) REFERENCES USER (id);

ALTER TABLE payment_method ADD FOREIGN KEY (user_id) REFERENCES USER (id);

ALTER TABLE product_image ADD FOREIGN KEY (product_id) REFERENCES PRODUCT (id);1
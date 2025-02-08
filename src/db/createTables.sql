CREATE DATABASE rewear;
USE rewear;

/* Tabla de usuarios */
CREATE TABLE user (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password CHAR(255) NOT NULL,
  registration_date DATE NOT NULL,
  PRIMARY KEY (id)
);

/* Tabla de productos */
CREATE TABLE product (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  seller_id INT NOT NULL,
  name_product VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description VARCHAR(400),
  status INT NOT NULL,
  publication_status ENUM('available','out_of_stock') NOT NULL DEFAULT 'available',
  publication_date DATE NOT NULL,
  CONSTRAINT fk_product_user
    FOREIGN KEY (seller_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

/* Tabla de reseñas */
CREATE TABLE reviews (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  comment VARCHAR(400),
  rating INT NOT NULL,
  comment_date DATE NOT NULL,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id)
    REFERENCES product(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

/* Tabla de transacciones */
CREATE TABLE transaction (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  product_id INT NOT NULL,
  buyer_id INT NOT NULL,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  total_amount INT NOT NULL,
  transaction_status ENUM('pending','completed','cancelled'),
  CONSTRAINT fk_transaction_product
    FOREIGN KEY (product_id)
    REFERENCES product(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_buyer
    FOREIGN KEY (buyer_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

/* Tabla de métodos de pago */
CREATE TABLE payment_method (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  payment_type ENUM('credit_card','paypal','bank_transfer') NOT NULL,
  payment_details TEXT NOT NULL,
  CONSTRAINT fk_payment_method_user
    FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

/* Tabla de imágenes de productos */
CREATE TABLE product_image (
  id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  image_id VARCHAR(255) NOT NULL,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  CONSTRAINT fk_product_image_product
    FOREIGN KEY (product_id)
    REFERENCES product(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

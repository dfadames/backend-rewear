CREATE TABLE user (
  id int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  first_name varchar(50) NOT NULL,
  last_names varchar(50) NOT NULL,
  phone varchar(15) NOT NULL,
  username varchar(15) NOT NULL,
  registration_date date NOT NULL,
  email varchar(100) UNIQUE NOT NULL,
  password char(255) NOT NULL,
  reset_token varchar(255) DEFAULT NULL,
  reset_token_expiry datetime DEFAULT NULL
);
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

-- Tabla de reseñas
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

-- Tabla de transacciones
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

-- Tabla de métodos de pago
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

-- Tabla de imágenes de productos
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

-- Tabla de carrito de compras
CREATE TABLE cart (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_cart_user
    FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product
    FOREIGN KEY (product_id)
    REFERENCES product(id)
    ON DELETE CASCADE
);
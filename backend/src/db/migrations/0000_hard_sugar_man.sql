CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`name_en` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_name_en_unique` UNIQUE(`name_en`)
);
--> statement-breakpoint
CREATE TABLE `product_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`original_name` varchar(500),
	`is_primary` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(30) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category_id` int,
	`length_mm` decimal(8,2),
	`width_mm` decimal(8,2),
	`height_mm` decimal(8,2),
	`weight_g` decimal(10,2),
	`cost_price` decimal(10,2) NOT NULL,
	`list_price` decimal(10,2) NOT NULL,
	`quality_description` text,
	`status` enum('in_stock','reserved','sold') NOT NULL DEFAULT 'in_stock',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`sale_price` decimal(10,2) NOT NULL,
	`channel` enum('line','shopee','livestream','in_person','other') NOT NULL,
	`sold_at` date NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `product_photos` ADD CONSTRAINT `product_photos_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX `sku_idx` ON `products` (`sku`);
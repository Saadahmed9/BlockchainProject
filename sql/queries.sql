create database donations;
use donations;

DROP table campaigns;

CREATE TABLE campaigns (
    id INT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target INT NOT NULL,
    deposit INT NOT NULL,
    amount_raised INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
SELECT * from donations where campaign_id=1 order by created_on;
INSERT INTO `donations`.`campaigns` (`id`, `created_by`, `status`, `vendor`, `description`, `target`, `deposit`, `amount_raised`) VALUES ('7', '1', 'CLOSED', '1', 'Description 8', '1000', '100', '0');

select * from campaigns where created_by=1;

drop table donations;

CREATE TABLE donations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    donated_by VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    INDEX (campaign_id)
);

select * from donations;
DELETE from donations WHERE campaign_id=1;
INSERT INTO donations (campaign_id, donated_by, amount) VALUES ('1', '0', 0);

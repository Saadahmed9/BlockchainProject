create database donations;
use donations;

DROP table campaigns;

CREATE TABLE campaigns (
    id INT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target DOUBLE NOT NULL,
    deposit DOUBLE NOT NULL,
    funds_raised DOUBLE NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

select * from campaigns;

drop table donations;

CREATE TABLE donations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    donated_by VARCHAR(255) NOT NULL,
    amount DOUBLE NOT NULL,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    INDEX (campaign_id)
);

select * from donations;

drop table airdrops;

CREATE TABLE airdrops (
    address VARCHAR(255) NOT NULL,
    PRIMARY KEY (address)
);

describe airdrops

select * from airdrops where address='123'
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
INSERT INTO `donations`.`campaigns` (`id`, `created_by`, `status`, `vendor`, `description`, `target`, `deposit`, `amount_raised`) VALUES ('16', '0x846580353AcDEAE821e3b3449d2eFa71E4Ca70F6', 'OPEN', '1', 'Description 16', '100', '10', '5');

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

SELECT *
FROM campaigns
WHERE id in p.campaign_id ();

select c.*,d.donated_by,sum(d.amount) as amount_donated from donations d LEFT JOIN campaigns c on d.campaign_id=c.id where d.donated_by="0x846580353AcDEAE821e3b3449d2eFa71E4Ca70F6"  group by d.campaign_id,d.donated_by

DELETE from donations WHERE campaign_id=1;
INSERT INTO donations (campaign_id, donated_by, amount) VALUES ('1', '0', 0);

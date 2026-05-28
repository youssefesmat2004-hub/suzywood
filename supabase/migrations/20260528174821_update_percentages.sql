UPDATE site_content
SET value = REPLACE(REPLACE(value, '70%', '75%'), '30%', '25%')
WHERE key IN ('faq_content', 'terms_content');

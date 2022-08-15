# Kill running proccess
pkill letsencrypt,certbot

# Turn of nginx
sudo service nginx stop

# Delete current cert error:
# Certbot-auto renew failed - The client lacks sufficient authorization
./certbot-auto certonly -d nextreading.com

# Renew
./certbot-auto renew

# Turn on nginx
sudo service nginx start

# If start nginx error:
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
# then
sudo service nginx restart
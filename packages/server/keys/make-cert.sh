openssl genrsa 1024 > key.pem
openssl req -x509 -new -nodes -config cert.config -key key.pem -sha256 -extensions v3_req -days 36524 -out cert.pem
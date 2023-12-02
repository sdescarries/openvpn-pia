# PIA VPN w/ Transmission

Add your PIA credentials to `credentials.txt`

```sh
> cat > credentials.txt
username
password
<ctrl>+<d>

> chmod og-rwx credentials.txt
```

Create a directory structure for torrent files

```sh
> mkdir -p data/{completed,incomplete,watch}
```

Start the container

```sh
> docker-compose up --build -d
> docker logs -f pia
```

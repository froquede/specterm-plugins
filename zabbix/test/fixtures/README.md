Test-only certificates for `zabbix.test.mjs`, made with `openssl ca` (1.1.1)
so a leaf can be dated in the past. Nothing here is used outside the tests;
the keys protect nothing.

- `ca.pem`: the root the tests trust.
- `expired.pem`: from that root, for 127.0.0.1 / localhost, expired in 2021.
- `expired-wrong-name.pem`: from that root, for other.test, expired.
- `expired-untrusted.pem`: for 127.0.0.1, expired, from a root not trusted.
- `valid.pem`: from that root, for 127.0.0.1, valid until 2045.

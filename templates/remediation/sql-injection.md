# 🔧 Remediation Guide: SQL Injection

## Vulnerability Overview

| Property | Value |
|----------|-------|
| **Severity** | 🔴 CRITICAL / 🟠 HIGH |
| **CVSS Score** | 8.6 - 9.8 |
| **CWE** | CWE-89 |
| **OWASP** | A03:2021 - Injection |
| **MITRE ATT&CK** | T1190 (Exploit Public-Facing Application) |

## Description

SQL Injection (SQLi) adalah kerentanan keamanan yang memungkinkan penyerang menyisipkan kode SQL berbahaya ke dalam query database melalui input yang tidak divalidasi. Ini dapat menyebabkan:

- **Data Breach**: Akses tidak sah ke data sensitif
- **Data Manipulation**: Modifikasi atau penghapusan data
- **Authentication Bypass**: Melewati sistem login
- **Remote Code Execution**: Pada kasus tertentu, eksekusi perintah OS

## Langkah Remediasi

### 1. Gunakan Parameterized Queries (Prepared Statements)

#### ❌ Kode Rentan (JANGAN GUNAKAN)

```javascript
// Node.js dengan MySQL - RENTAN!
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
connection.query(query, (err, results) => {
  // ...
});
```

```python
# Python dengan SQLite - RENTAN!
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

```php
// PHP dengan MySQL - RENTAN!
$query = "SELECT * FROM products WHERE id = " . $_GET['id'];
$result = mysqli_query($conn, $query);
```

#### ✅ Kode Aman (GUNAKAN INI)

```javascript
// Node.js dengan MySQL - AMAN
const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
connection.query(query, [username, password], (err, results) => {
  // ...
});

// Dengan named parameters
const query = 'SELECT * FROM users WHERE username = :username';
connection.query(query, { username: username }, (err, results) => {
  // ...
});
```

```python
# Python dengan SQLite - AMAN
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# Dengan named parameters
cursor.execute("SELECT * FROM users WHERE id = :id", {"id": user_id})
```

```php
// PHP dengan PDO - AMAN
$stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id');
$stmt->execute(['id' => $_GET['id']]);
$result = $stmt->fetch();
```

### 2. Gunakan ORM (Object-Relational Mapping)

```javascript
// Prisma ORM - AMAN
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Sequelize ORM - AMAN
const users = await User.findAll({
  where: { status: 'active' }
});
```

```python
# SQLAlchemy ORM - AMAN
user = session.query(User).filter(User.id == user_id).first()

# Django ORM - AMAN
user = User.objects.get(id=user_id)
```

### 3. Input Validation & Sanitization

```javascript
// Validasi input dengan whitelist
function validateSortColumn(column) {
  const allowedColumns = ['id', 'name', 'created_at', 'updated_at'];
  if (!allowedColumns.includes(column)) {
    throw new Error('Invalid sort column');
  }
  return column;
}

// Validasi tipe data
function validateId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Invalid ID');
  }
  return parsed;
}
```

### 4. Escape Special Characters (Last Resort)

```javascript
// MySQL escape - gunakan hanya jika tidak bisa pakai prepared statements
const mysql = require('mysql');
const escapedValue = mysql.escape(userInput);
```

### 5. Least Privilege Database Accounts

```sql
-- Buat user dengan hak akses minimal
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Berikan hanya permission yang diperlukan
GRANT SELECT, INSERT, UPDATE ON myapp.users TO 'app_user'@'localhost';
GRANT SELECT ON myapp.products TO 'app_user'@'localhost';

-- JANGAN berikan permission berbahaya
-- REVOKE DROP, DELETE, ALTER, CREATE ON *.* FROM 'app_user'@'localhost';
```

### 6. Web Application Firewall (WAF) Rules

```nginx
# ModSecurity rules untuk SQLi
SecRule ARGS "@detectSQLi" \
    "id:942100,\
    phase:2,\
    block,\
    capture,\
    t:none,t:utf8toUnicode,t:urlDecodeUni,t:removeNulls,\
    msg:'SQL Injection Attack Detected',\
    logdata:'Matched Data: %{TX.0} found within %{MATCHED_VAR_NAME}',\
    tag:'application-multi',\
    tag:'language-multi',\
    tag:'platform-multi',\
    tag:'attack-sqli',\
    tag:'OWASP_CRS',\
    tag:'capec/1000/152/248/66',\
    tag:'PCI/6.5.2',\
    severity:'CRITICAL'"
```

## Checklist Verifikasi

- [ ] Semua query database menggunakan parameterized queries
- [ ] Tidak ada string concatenation dalam SQL queries
- [ ] Input validation diterapkan di semua entry points
- [ ] Database user menggunakan least privilege principle
- [ ] Error messages tidak mengekspos informasi database
- [ ] WAF rules untuk SQLi detection aktif
- [ ] Regular security testing dilakukan

## Testing

### Manual Testing Payloads

```
' OR '1'='1
" OR "1"="1
' OR '1'='1' --
' OR '1'='1' /*
'; DROP TABLE users; --
1' AND '1'='1
1 UNION SELECT NULL,NULL,NULL --
1' ORDER BY 1 --
```

### Automated Testing

```bash
# SQLMap
sqlmap -u "https://target.com/page?id=1" --batch --risk=3 --level=5

# Burp Suite Active Scan
# Enable SQL Injection checks in scan configuration
```

## References

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection)
- [NIST NVD - SQL Injection](https://nvd.nist.gov/vuln/search)

---

*Document generated by AI Code Studio Security Scanner*
*Last updated: {{DATE}}*

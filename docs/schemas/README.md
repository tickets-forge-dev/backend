# AEC XML Schema Documentation

This directory contains the XML Schema Definition (XSD) and documentation for the AEC (Agent Executable Contract) XML format.

---

## Files in This Directory

### 1. `aec-v1.xsd`
Complete XML Schema Definition for AEC v1.0.

**Usage:**
- Validate XML files against this schema
- IDE autocomplete for XML editing
- External system integration
- Contract enforcement

**Namespace:** `https://executable-tickets.com/schema/aec/v1`

### 2. `AEC_XML_QUICK_REFERENCE.md`
Quick reference guide with:
- Minimal valid example
- Section breakdown with examples
- Enum values reference
- Validation rules

**Use when:** You need to quickly understand the XML structure or create a new AEC XML file.

---

## Related Documentation

- **Complete Specification:** `../aec-xml-specification.md`
- **Implementation Summary:** `../AEC_XML_FORMAT_SUMMARY.md`
- **Story Details:** `../epics.md` (Story 2.5)
- **Architecture:** `../architecture.md` (Data Architecture)

---

## Validation Example

### Command Line (xmllint)
```bash
xmllint --noout --schema aec-v1.xsd your-aec-file.xml
```

### Node.js (libxmljs2)
```javascript
const libxml = require('libxmljs2');
const fs = require('fs');

const xsdDoc = libxml.parseXml(fs.readFileSync('aec-v1.xsd', 'utf8'));
const xmlDoc = libxml.parseXml(fs.readFileSync('your-aec-file.xml', 'utf8'));

const isValid = xmlDoc.validate(xsdDoc);
console.log(isValid ? 'Valid' : 'Invalid');

if (!isValid) {
  console.log(xmlDoc.validationErrors);
}
```

---

## Schema Version History

- **v1.0** (2026-02-01): Initial specification
  - 8 main sections (metadata → export)
  - 30+ complex types
  - 15+ simple types and enums
  - Full validation rules

---

## Future Versions

Planned enhancements for future schema versions:

- **v1.1**: Add support for custom fields per workspace
- **v2.0**: Add support for multi-repo tickets
- **v2.1**: Add support for dependency tracking between AECs

---

## Contact & Contributions

This schema is part of the Executable Tickets project.

For questions or suggestions, refer to the main project documentation.

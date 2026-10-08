# API Integration Guidelines

This file defines rules for integrating backend endpoints into frontend components.

---

## 1. New Endpoint Integration

When integrating a new backend endpoint:

1. **Do not write any backend logic inside the main frontend file** (e.g., `Exam.jsx`).
2. Always create **two separate files** for the endpoint:

   - Service file: `src/api/services/{endpoints}.service.js`
   - Adapter file: `src/api/adapters/{endpoints}.adapter.js`

3. The main frontend file imports **only the adapter or service functions** — no backend logic inside the component and remove all mock data from main frontend file.

**Example:**

Integrating a new `Exam` endpoint:

- `src/API/services/exam.service.js`
- `src/API/adapters/exam.adapter.js`
- `Exam.jsx` (imports the adapter/service, does not contain backend code)


---

## 2. Reusable Existing Services

For common entities like **academic years, grades, and sections**:

- Use the existing services and adapters:
  - `src/API/services/classHierarchy.service.js`
  - `src/API/services/academicYears.service.js`
  - `src/API/adapters/academicYears.adapter.js`
  - `src/API/adapters/ClassesAdapter.js`

- **Do not modify these files**.
- Only import and use the functions from these files.

**Example usage in Exam.jsx:**

```javascript
import { getAcademicYears } from "src/API/services/academicYears.service";
import { ClassesAdapter } from "src/API/adapters/academicYears.adapter";

// Use these to fetch and display academic years, grades, sections
```

---

## 3. Rules Summary

- Each new endpoint gets its own service + adapter.
- Main frontend files must remain free of backend logic.
- Reuse existing services/adapters for shared data — do not modify them.
- Always integrate via service → adapter → component.
- Keep code modular, maintainable, and aligned with existing project architecture.
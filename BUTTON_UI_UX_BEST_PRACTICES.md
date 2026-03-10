# Button UI/UX Best Practices

## Enterprise Standards Applied
Based on design systems from Microsoft Fluent, Material Design (Google), Apple HIG, and Amazon's design principles.

## Core Principles

### 1. Concise Button Text (1-2 Words)
- ❌ "Add New Temple" → ✅ "New Temple" or "Add Temple"
- ❌ "Create New User" → ✅ "Create User" or "New User"
- ❌ "Update Temple" → ✅ "Update" or "Save"
- ❌ "View Details" → ✅ "View" or "Details"
- ❌ "Manage Artifacts" → ✅ "Artifacts"

### 2. Action-Oriented Verbs
Use clear, direct verbs that describe the action:
- Create, Add, New
- Edit, Update, Save
- Delete, Remove
- View, Show, Open
- Cancel, Close
- Retry, Refresh

### 3. Remove Redundant Words
- Remove "New" when context is clear (e.g., in a "Create" form)
- Remove articles (a, an, the)
- Remove prepositions when possible

### 4. Icon + Text Pattern
- Primary actions: Icon + Text (e.g., "➕ New Temple")
- Secondary actions: Text only or Icon only (with tooltip)
- Icon-only buttons: Always include title/tooltip for accessibility

### 5. Button Hierarchy
- **Primary**: Main action (e.g., Save, Create, Submit)
- **Secondary**: Alternative actions (e.g., Cancel, Back)
- **Tertiary/Icon**: Less important actions (e.g., Edit, Delete)

## Applied Changes

### Temple Management
| Before | After | Reason |
|--------|-------|--------|
| "Add New Temple" | "New Temple" | Concise, clear action |
| "View Details" | "View" | Remove redundant word |
| "Edit Temple" | "Edit" | Context is clear |
| "Manage Artifacts" | "Artifacts" | Simpler, action implied |
| "Update Temple" | "Save" | Standard save action |
| "Create Temple" | "Create" | Context is clear from form |

### User Management
| Before | After | Reason |
|--------|-------|--------|
| "Add Dashboard User" | "New User" | Concise, clear |
| "Create User" | "Create" | Context is clear |

### Trusted Sources
| Before | After | Reason |
|--------|-------|--------|
| "Add New Source" | "New Source" | Remove redundant "Add" |
| "Add Your First Source" | "Add Source" | Simpler |
| "Save Changes" | "Save" | Standard action |

### Navigation
| Before | After | Reason |
|--------|-------|--------|
| "Back to Temples" | "← Back" | Icon + concise text |

## Accessibility Considerations
- All icon-only buttons include `title` or `aria-label` attributes
- Button text remains clear and descriptive
- Color contrast meets WCAG AA standards
- Focus states are visible

## References
- [Microsoft Fluent Design](https://fluent2.microsoft.design/)
- [Material Design (Google)](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Nielsen Norman Group - Button UX](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/)

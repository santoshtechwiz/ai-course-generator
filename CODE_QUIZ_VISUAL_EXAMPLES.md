# Code Quiz Display - Visual Examples

## Option Rendering Examples

### 1. Fill-in-the-Blank Question

**Question:** "What keyword completes this code to declare a constant?"

**Code Snippet:**
```javascript
____ PI = 3.14159;
console.log(PI);
```

**Options Display:**

```
┌─────────────────────────────────────────────────┐
│  A   ┌──────┐                                   │ ← Styled code box
│      │const │                                    │
│      └──────┘                                    │
├─────────────────────────────────────────────────┤
│  B   ┌───┐                                       │
│      │let│                                       │
│      └───┘                                       │
├─────────────────────────────────────────────────┤
│  C   ┌───┐                                       │
│      │var│                                       │
│      └───┘                                       │
├─────────────────────────────────────────────────┤
│  D   ┌────────┐                                  │
│      │function│                                  │
│      └────────┘                                  │
└─────────────────────────────────────────────────┘
```

### 2. Output Question

**Question:** "What will this code log to the console?"

**Code Snippet:**
```javascript
const arr = [1, 2, 3];
console.log(arr.length);
```

**Options Display:**

```
┌─────────────────────────────────────────────────┐
│  A   "3"                                         │ ← Plain text (exact value)
├─────────────────────────────────────────────────┤
│  B   "undefined"                                 │
├─────────────────────────────────────────────────┤
│  C   "[1, 2, 3]"                                 │
├─────────────────────────────────────────────────┤
│  D   "0"                                         │
└─────────────────────────────────────────────────┘
```

### 3. Mixed Content (Code + Text)

**Question:** "Which statement correctly describes the behavior?"

**Options Display:**

```
┌────────────────────────────────────────────────────────┐
│  A   The ┌─────┐ keyword creates immutable bindings   │
│          │const│                                       │
│          └─────┘                                       │
├────────────────────────────────────────────────────────┤
│  B   The ┌───┐ keyword allows reassignment            │
│          │let│                                         │
│          └───┘                                         │
├────────────────────────────────────────────────────────┤
│  C   The ┌───┐ keyword is function-scoped             │
│          │var│                                         │
│          └───┘                                         │
├────────────────────────────────────────────────────────┤
│  D   All keywords behave identically                   │
└────────────────────────────────────────────────────────┘
```

### 4. Expression/Operator Question

**Question:** "What operator correctly completes this comparison?"

**Code Snippet:**
```javascript
if (typeof x ____ 'number') {
  console.log('x is a number');
}
```

**Options Display:**

```
┌─────────────────────────────────────────────────┐
│  A   ┌───┐                                       │
│      │===│  ← Operator styled as code            │
│      └───┘                                       │
├─────────────────────────────────────────────────┤
│  B   ┌───┐                                       │
│      │!==│                                       │
│      └───┘                                       │
├─────────────────────────────────────────────────┤
│  C   ┌──┐                                        │
│      │==│                                        │
│      └──┘                                        │
├─────────────────────────────────────────────────┤
│  D   ┌──┐                                        │
│      │!=│                                        │
│      └──┘                                        │
└─────────────────────────────────────────────────┘
```

### 5. Method Call Question

**Question:** "What method should be used to add an element?"

**Code Snippet:**
```javascript
const arr = [1, 2, 3];
arr.____(4);
```

**Options Display:**

```
┌─────────────────────────────────────────────────┐
│  A   ┌────────┐                                  │
│      │arr.push│  ← Method styled as code         │
│      └────────┘                                  │
├─────────────────────────────────────────────────┤
│  B   ┌───────┐                                   │
│      │arr.pop│                                   │
│      └───────┘                                   │
├─────────────────────────────────────────────────┤
│  C   ┌──────────┐                                │
│      │arr.concat│                                │
│      └──────────┘                                │
├─────────────────────────────────────────────────┤
│  D   ┌──────────┐                                │
│      │arr.splice│                                │
│      └──────────┘                                │
└─────────────────────────────────────────────────┘
```

## Code Snippet Display

### Main Code Block (Always Syntax Highlighted)

```
┌────────────────────────────────────────────────┐
│  📖  CODE SNIPPET                    JavaScript│
├────────────────────────────────────────────────┤
│                                                 │
│  1  const users = ['Alice', 'Bob'];            │
│  2  users.push('Charlie');                     │
│  3                                              │
│  4  console.log(users.length);                 │
│  5                                              │
│                                                 │
│  [Dark theme, syntax colors, line numbers]     │
│                                                 │
└────────────────────────────────────────────────┘
```

### With Fill-in-the-Blank

```
┌────────────────────────────────────────────────┐
│  📖  CODE SNIPPET                    JavaScript│
├────────────────────────────────────────────────┤
│                                                 │
│  1  ____ result = numbers.map(x => x * 2);    │
│  2                                              │
│  3  console.log(result);                       │
│  4                                              │
│                                                 │
│  [Blank clearly visible for student to fill]   │
│                                                 │
└────────────────────────────────────────────────┘
```

## Styling Details

### Code Element Styling (in options):

**Monospace Code Box:**
- Font: `Monaco, Consolas, "Courier New", monospace`
- Background: Subtle muted background
- Border: 2px solid border with theme colors
- Padding: Small padding for readability
- Border-radius: Slightly rounded corners

**Selected State:**
- Background: Highlighted with quiz-type color (green for code)
- Border: Bold border in accent color
- Text: Bold and colored
- Animation: Smooth scale animation on selection

### Regular Text Options:
- Font: System font (readable, not monospace)
- No special background
- Standard padding and spacing

## Responsive Behavior

### Desktop (>1024px):
- Options displayed in full width
- Code boxes inline with text
- Comfortable spacing

### Tablet (768px - 1024px):
- Options maintain full width
- Code boxes wrap naturally
- Slightly reduced padding

### Mobile (<768px):
- Options stack vertically
- Code boxes take full width if needed
- Touch-friendly tap targets (minimum 44px height)

## Accessibility

### Screen Readers:
- Code elements announced as "code"
- Option letters announced before content
- Selected state announced

### Keyboard Navigation:
- Arrow keys to navigate options
- Enter/Space to select
- Focus indicators visible

### Color Contrast:
- Text meets WCAG AA standards
- Code has sufficient contrast
- Selected state clearly distinguished

## Animation & Interaction

### Hover State:
```
┌─────────────────────────────────────────────────┐
│  A   ┌──────┐  ← Subtle lift on hover           │
│      │const │                                    │
│      └──────┘                                    │
└─────────────────────────────────────────────────┘
     ↑ Slight upward movement (-2px)
     Shadow increases
```

### Selection Animation:
```
1. Click option
2. Scale slightly (0.98)
3. Background color animates in
4. Checkmark appears with rotation
5. Code box changes color
```

### Loading State:
```
┌─────────────────────────────────────────────────┐
│  A   ┌──────┐  [🔄 Spinner]                     │
│      │const │                                    │
│      └──────┘                                    │
└─────────────────────────────────────────────────┘
     Subtle blur with loading indicator
```

## Theme Support

### Light Theme:
- Code background: `bg-muted` (light gray)
- Border: Dark border for contrast
- Text: Dark text on light background

### Dark Theme:
- Code background: `bg-muted/50` (semi-transparent gray)
- Border: Light border for visibility
- Text: Light text on dark background

Both themes maintain consistent code appearance and readability.

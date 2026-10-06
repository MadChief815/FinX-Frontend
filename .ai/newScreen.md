name: new-screen
description: Use when creating or implementing any new React Native screen in FinX Pulse. Trigger on "create screen", "add screen", "build screen", or implementing a new screen/page.

# Rules

Read before writing:

* Styling -> `src/utils/TextStyles`, `src/utils/Colors`, `src/utils/screenStyles`, `src/utils/Responsive`
* Header -> `src/components/Header`
* Reusable UI -> existing components in `src/components`

Core (always):

1. All screens MUST be TypeScript `.tsx` files. Never create `.js` or `.jsx` screens.
2. Root container MUST use `screenStyles.container`.
3. Reuse `Header` for screen headers. Do not create another header unless required.
4. Use `TextStyles` for typography. Do not duplicate existing text styles.
5. Use `Colors` for colors. Do not hard-code colors when an existing color exists.
6. Use `ms`, `s`, `vs` from `Responsive` for responsive sizing/spacing where appropriate.
7. Shared component/utility imports MUST be under `// Components`.
8. Add simple JSX section comments such as `{/* Header */}`, `{/* Title */}`, `{/* Form */}`, `{/* Actions */}`.
9. Reuse existing components before creating new components.
10. Keep screen-specific styles inside the screen unless they are reusable.
11. Use proper TypeScript types. Avoid `any`.
12. Follow existing navigation, state, API, and project architecture. Do not introduce new libraries/patterns unnecessarily.
13. Forms must validate input, handle loading/submission state, prevent duplicate submission, and show safe errors.
14. Never hard-code secrets, tokens, credentials, API URLs, or sensitive financial data.
15. Never log passwords, tokens, credentials, or sensitive financial data.
16. Handle loading, empty, error, and success states where applicable.
17. Consider accessibility, keyboard behavior, and touch targets.
18. Keep code simple, maintainable, responsive, and consistent with existing screens.
19. Use current React Native and TypeScript security/best-practice standards.

Screen pattern:

```tsx
// Components
import Header from '../../components/Header';
import { ms, s, vs } from '../../utils/Responsive';
import { screenStyles } from '../../utils/screenStyles';
import { TextStyles } from '../../utils/TextStyles';
import { Colors } from '../../utils/Colors';

export default function LoginScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={screenStyles.container}>

      {/* Header */}
      <Header title="Sign In" back={false} />

      {/* Title */}
      ...

    </SafeAreaView>
  );
}
```

If unsure: inspect the most similar existing `.tsx` screen and follow its pattern.

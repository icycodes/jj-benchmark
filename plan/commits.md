# Selected Wasp Benchmark Candidates from Commit History

This document outlines 10 high-quality candidates selected from the `fetched_commits.json` history of the Wasp repository. These candidates represent meaningful, real-world bug fixes, architectural refactorings, or complex feature additions, while ignoring trivial commits (such as typo fixes, simple dependency bumps, or pure documentation updates).

Each candidate is evaluated for its suitability as a container-based, self-contained benchmark task that does not depend on external cloud infrastructure.

---

## Candidate List

### 1. Prevent concurrent commands from corrupting project state
* **SHA**: `84888061e66d87a99b972b8da5f3e3e27c2bae0c`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/84888061e66d87a99b972b8da5f3e3e27c2bae0c)
* **Commit Message**: `Prevent concurrent commands from corrupting project state (#4504)`
* **Category**: Complex Bug Fix / Concurrency Control
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes. It implements lock-based state protection locally on the filesystem or process level.
  * **Technical Depth**: High. Concurrency and race conditions in system commands require implementing robust file locking or lockfiles in Haskell. It tests the agent's ability to handle concurrency, system-level I/O, and cross-platform file safety.
  * **Testability**: Highly testable in a container by spawning concurrent `wasp` commands and asserting that subsequent commands block or exit gracefully with a clear error instead of corrupting the build directory.

### 2. Discover dev db port from Docker at compile time
* **SHA**: `0b9c323211b49c6722d548d8c353f77a19b31342`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/0b9c323211b49c6722d548d8c353f77a19b31342)
* **Commit Message**: `Discover dev db port from Docker at compile time (#4567)`
* **Category**: Complex Feature / Integration
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, requires a local Docker daemon.
  * **Technical Depth**: Medium-High. Instead of assuming a static hardcoded port for the development PostgreSQL database, this feature queries Docker containers dynamically at compile/generation time to discover the actual mapped port.
  * **Testability**: Excellent. A test suite can spin up a PostgreSQL container on a non-standard port, run the compiler, and verify that the compiled application successfully connects to the discovered port.

### 3. Bridge user values to Wasp SDK without direct dependency
* **SHA**: `0df14f7d429646a678ed537d36031fdca08f1b77`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/0df14f7d429646a678ed537d36031fdca08f1b77)
* **Commit Message**: `Bridge user values to Wasp SDK without direct dependency (#4067)`
* **Category**: Architectural Refactoring / Code Generation
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, operates purely on local templates and generated code files.
  * **Technical Depth**: High. Solves a complex circular dependency problem by generating intermediate declaration files and bridging user values to the SDK at compilation time. This requires modifying Wasp's Haskell-based code generator and TypeScript templates.
  * **Testability**: Very solid. Can be verified by running the code generator on a sample project and ensuring that both the SDK and user code compile successfully and resolve types correctly.

### 4. Return the AppSpec from the compiler pipeline
* **SHA**: `4bc47da74b09d8d21fff2be99a7bba4b044918dd`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/4bc47da74b09d8d21fff2be99a7bba4b044918dd)
* **Commit Message**: `Return the AppSpec from the compiler pipeline (#4583)`
* **Category**: Compiler Architecture
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, purely compiler-level logic.
  * **Technical Depth**: High. Refactors Wasp's compilation pipeline to explicitly return the parsed and validated `AppSpec` data structure rather than executing compilation side-effects directly. It requires working with Haskell's functional pipelines, state monads, and adjusting type signatures across multiple core modules.
  * **Testability**: Excellent. Can be verified by unit testing the compiler pipeline functions directly, ensuring they yield the correct `AppSpec` structure.

### 5. Generate markdown docs and return them on `.md` suffix or `Accept` header
* **SHA**: `4ce6d527f5ef650fa58628f7918c297dafcc8612`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/4ce6d527f5ef650fa58628f7918c297dafcc8612)
* **Commit Message**: `Generate markdown docs. Return them on \`.md\` path suffix or \`Accept\` markdown header (#4359)`
* **Category**: Complex Web Feature / Middleware
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, runs inside the local web/documentation server.
  * **Technical Depth**: Medium. Involves writing a server-side middleware pipeline to convert HTML/Docusaurus pages to Markdown dynamically when requested via specific headers or URL suffixes.
  * **Testability**: Very straightforward. An automated test can start the server locally, send requests with/without the `Accept: text/markdown` header or `.md` suffix, and verify that the served response is valid Markdown.

### 6. Refactor `wasp start db`
* **SHA**: `bfb6d2ae3ce29fa5b67992ea250c3b644083fa34`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/bfb6d2ae3ce29fa5b67992ea250c3b644083fa34)
* **Commit Message**: `Refactor \`wasp start db\` (#4612)`
* **Category**: Refactoring / CLI Database Management
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, manages a local dev database.
  * **Technical Depth**: Medium. Refactors the logic that manages the local PostgreSQL Docker container. It requires handling container lifecycles, volume management, and gracefully handling edge cases like when Docker is not running or ports are already bound.
  * **Testability**: Highly testable using container-based integration tests that verify database containers are correctly initialized, started, and stopped.

### 7. Add `wasp show spec` command
* **SHA**: `3c1b299ace05c635763287cc0fc8bb0766ad1083`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/3c1b299ace05c635763287cc0fc8bb0766ad1083)
* **Commit Message**: `Add \`wasp show spec\` command (#4451)`
* **Category**: Feature Addition / CLI Interface
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, CLI command.
  * **Technical Depth**: Medium. Introduces a new command hierarchy (`wasp show spec`) to serialize and display the compiled application specification (`AppSpec`) in JSON or formatted text. It tests CLI argument parsing, Haskell serialization, and integration with existing commands.
  * **Testability**: Very easy to test by running the CLI command against a dummy project and asserting the JSON output matches a pre-defined schema.

### 8. Group SDK package.json exports by consumer
* **SHA**: `3b3810282a45970c19887b3334dc685d8e1f1bc2`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/3b3810282a45970c19887b3334dc685d8e1f1bc2)
* **Commit Message**: `Group SDK package.json exports by consumer (#4538)`
* **Category**: Architectural Refactoring / Packaging
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, purely configuration and template-driven.
  * **Technical Depth**: Medium. Restructures the generated SDK's `package.json` to group exports by target consumer (client, server, universal). This ensures modern bundlers (Vite, Rollup, Webpack) resolve modules correctly.
  * **Testability**: Highly testable. An automated test can run a standard build of the generated SDK and attempt to import client-only/server-only modules from respective environments, checking for correct bundler resolution behavior.

### 9. Add explanatory hints to the forced Vite config options error
* **SHA**: `c6abff4f0e38f46fafae764a07fe572a62a30806`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/c6abff4f0e38f46fafae764a07fe572a62a30806)
* **Commit Message**: `Add explanatory hints to the forced Vite config options error (#4582)`
* **Category**: UX Improvement / Compiler Validation
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, validation logic in the compiler.
  * **Technical Depth**: Low-Medium. Adds validation logic to catch when a user tries to override Vite config options that Wasp requires, and outputs clear, actionable hints on how to resolve the conflict. Excellent for testing user-friendly error design and validation patterns.
  * **Testability**: Simple. Run the compiler against a project with conflicting Vite configuration and assert that the CLI exits with the expected error code and prints the exact hint message.

### 10. Add `wasp show build` command
* **SHA**: `5ef19c280d696d66c798381c78d16e6179f72796`
* **URL**: [Commit Link](https://github.com/wasp-lang/wasp/commit/5ef19c280d696d66c798381c78d16e6179f72796)
* **Commit Message**: `Add \`wasp show build\` command (#4625)`
* **Category**: Feature Addition / CLI Interface
* **Why it makes a good benchmark task**:
  * **Self-contained**: Yes, CLI command.
  * **Technical Depth**: Medium. Introduces a command to output build-time metadata. It shares a subcommand structure with `wasp show spec`, making it a great exercise in structuring CLI programs, deriving options from a common structure, and outputting JSON.
  * **Testability**: Easily verified by invoking `wasp show build --json` and asserting that the JSON output contains correct build fields.

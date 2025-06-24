# QuizHelper

QuizHelper for BBC Youth Bible Quiz.

## Requirements
- Node.js version 18 or higher
- A physical button that sends signals to the API endpoint
> Important: Your laptop or computer's IP address must be set to `192.168.100.101` to receive signals from the button.

## How to Set Up
1. **Clone the repository**:
    ```bash
    git clone https://github.com/AuroraCaelum/QuizHelper.git
    cd QuizHelper
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Run the development server**:
    ```bash
    npm run dev
    ```

4. **Open your browser** and navigate to `http://localhost:9090` to view the application.

## Signal Endpoint

The physical button signals are sent to the API endpoint at `localhost:9090` (or, as default set in the current button, `192.168.100.101:9090`). The API expects a GET request with the following body:

```json
{
  "sig": "string",
}
```

The `sig` field contains a unique signal string, which is A-G.

## Dependencies

This project uses [SvelteKit](https://kit.svelte.dev/) and requires Node.js version 18 or higher.

Add-ons include:
- [Svelte](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prettier](https://prettier.io/)
- [ESLint](https://eslint.org/)

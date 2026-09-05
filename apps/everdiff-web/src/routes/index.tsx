import { Heading } from "@ariakit/react/heading";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main {...stylex.props(styles.page)}>
      <Heading render={<h1 />} {...stylex.props(styles.heading)}>
        Hello world
      </Heading>
    </main>
  );
}

const styles = stylex.create({
  page: {
    minHeight: "100dvh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    backgroundColor: "#111113",
    color: "#eeeeef",
  },
  heading: {
    margin: 0,
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: "-0.04em",
  },
});

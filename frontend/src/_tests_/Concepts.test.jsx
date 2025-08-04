import { render, screen, fireEvent } from "@testing-library/react";
import Concepts from "../Concepts";

test("renders Get AI Concepts button", () => {
  render(<Concepts />);
  expect(screen.getByText(/Get AI Concepts/i)).toBeInTheDocument();
});

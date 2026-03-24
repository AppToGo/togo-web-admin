import { render, screen } from "@testing-library/react";
import { GlassCard } from "../GlassCard";
import { Trophy, DollarSign } from "lucide-react";

describe("GlassCard", () => {
  it("renders children correctly", () => {
    render(
      <GlassCard>
        <div data-testid="test-content">Test Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders with header", () => {
    render(
      <GlassCard
        header={{
          title: "Test Title",
          icon: <Trophy data-testid="header-icon" className="h-5 w-5" />,
        }}
      >
        <div>Content</div>
      </GlassCard>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByTestId("header-icon")).toBeInTheDocument();
  });

  it("renders with right content in header", () => {
    render(
      <GlassCard
        header={{
          title: "Test Title",
          rightContent: <span data-testid="right-content">10 items</span>,
        }}
      >
        <div>Content</div>
      </GlassCard>
    );

    expect(screen.getByTestId("right-content")).toBeInTheDocument();
    expect(screen.getByText("10 items")).toBeInTheDocument();
  });

  it("applies glass variant styles by default", () => {
    const { container } = render(
      <GlassCard>
        <div>Content</div>
      </GlassCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-card-xl");
    expect(card.className).toContain("backdrop-blur-xl");
    expect(card.className).toContain("border-white/40");
  });

  it("applies gradient variant styles", () => {
    const { container } = render(
      <GlassCard variant="gradient" colorScheme="indigo">
        <div>Content</div>
      </GlassCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-card-lg");
    expect(card.className).toContain("bg-gradient-indigo-purple");
  });

  it("applies solid variant styles", () => {
    const { container } = render(
      <GlassCard variant="solid">
        <div>Content</div>
      </GlassCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("rounded-card-lg");
    expect(card.className).toContain("bg-white");
    expect(card.className).toContain("border-slate-100");
  });

  it("applies custom className", () => {
    const { container } = render(
      <GlassCard className="custom-class">
        <div>Content</div>
      </GlassCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });

  it("applies different content padding sizes", () => {
    const { container: containerSm } = render(
      <GlassCard contentPadding="sm">
        <div>Content</div>
      </GlassCard>
    );
    expect(containerSm.querySelector(".p-3")).toBeInTheDocument();

    const { container: containerMd } = render(
      <GlassCard contentPadding="md">
        <div>Content</div>
      </GlassCard>
    );
    expect(containerMd.querySelector(".p-4")).toBeInTheDocument();

    const { container: containerLg } = render(
      <GlassCard contentPadding="lg">
        <div>Content</div>
      </GlassCard>
    );
    expect(containerLg.querySelector(".p-6")).toBeInTheDocument();

    const { container: containerNone } = render(
      <GlassCard contentPadding="none">
        <div>Content</div>
      </GlassCard>
    );
    expect(containerNone.querySelector('[class*="p-"]')).not.toBeInTheDocument();
  });

  it("applies gradient styles for different color schemes", () => {
    const colorSchemes = [
      { scheme: "emerald", gradient: "bg-gradient-emerald-teal" },
      { scheme: "amber", gradient: "bg-gradient-orange-amber" },
      { scheme: "blue", gradient: "bg-gradient-blue-cyan" },
      { scheme: "purple", gradient: "bg-gradient-purple-indigo" },
      { scheme: "slate", gradient: "bg-gradient-slate-dark" },
    ] as const;

    colorSchemes.forEach(({ scheme, gradient }) => {
      const { container } = render(
        <GlassCard variant="gradient" colorScheme={scheme}>
          <div>Content</div>
        </GlassCard>
      );

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain(gradient);
    });
  });

  it("renders header with correct text colors for gradient variant", () => {
    render(
      <GlassCard
        variant="gradient"
        colorScheme="indigo"
        header={{
          title: "Gradient Title",
          icon: <DollarSign className="h-5 w-5" />,
          rightContent: "Right",
        }}
      >
        <div>Content</div>
      </GlassCard>
    );

    const title = screen.getByText("Gradient Title");
    expect(title.className).toContain("text-white");
  });

  it("renders header with correct text colors for glass variant", () => {
    render(
      <GlassCard
        variant="glass"
        header={{
          title: "Glass Title",
        }}
      >
        <div>Content</div>
      </GlassCard>
    );

    const title = screen.getByText("Glass Title");
    expect(title.className).toContain("text-slate-700");
  });
});

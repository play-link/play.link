import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
}

// Styles
const main = {
  backgroundColor: "#0f172a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#cbd5e1",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#8b5cf6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "500",
  padding: "12px 24px",
  textDecoration: "none",
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  marginTop: "32px",
};

// Component
export default function WelcomeEmail({ name = "there" }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Play.link!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to Play.link</Heading>
          <Text style={text}>Hey {name},</Text>
          <Text style={text}>
            Thanks for signing up! We're excited to have you on board.
          </Text>
          <Section style={buttonSection}>
            <Button style={button} href="https://play.link">
              Get Started
            </Button>
          </Section>
          <Text style={footer}>— The Play.link Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

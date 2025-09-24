import { SpinnerShowcase } from "@/components/ui/spinner-showcase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SpinnersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Modern Interactive Spinners
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Experience the next generation of loading indicators designed
            specifically for AI-powered applications. Each spinner is crafted
            with unique animations and interactive elements to enhance user
            engagement.
          </p>
        </div>

        <Card className="mb-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Enhanced User Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <p>
              Our modern spinners replace traditional heartbeat and pulse
              animations with sophisticated, context-aware loading indicators.
              Each variant is optimized for different use cases within the
              ISC-CodeConnect platform:
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                • <strong>Neural Network:</strong> AI processing and machine
                learning tasks
              </li>
              <li>
                • <strong>Code Pulse:</strong> Code generation and development
                assistance
              </li>
              <li>
                • <strong>Quantum Dots:</strong> Complex computations and
                analysis
              </li>
              <li>
                • <strong>Orbital Motion:</strong> Scientific analysis and
                research tasks
              </li>
              <li>
                • <strong>Matrix Rain:</strong> Data processing and system
                operations
              </li>
              <li>
                • <strong>DNA Helix:</strong> Advanced algorithms and biological
                computations
              </li>
            </ul>
          </CardContent>
        </Card>

        <SpinnerShowcase />

        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Implementation</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <p className="mb-4">
              These spinners have been integrated throughout the application to
              replace traditional loading indicators. They provide better visual
              feedback and maintain user engagement during processing
              operations.
            </p>
            <div className="bg-slate-900/50 p-4 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Usage Examples:</h4>
              <div className="text-sm space-y-1">
                <div>
                  • Agent Progress indicators now use Neural and Code spinners
                </div>
                <div>• Message thinking states use Quantum Dots animations</div>
                <div>
                  • Analysis progress displays Matrix and Orbital spinners
                </div>
                <div>
                  • System loading uses DNA Helix for complex operations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

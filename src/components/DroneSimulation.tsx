import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Wind, TrendingUp, Activity } from "lucide-react";
import { DroneEnvironment } from "@/lib/agents/DroneEnvironment";
import { ReflexAgent } from "@/lib/agents/ReflexAgent";
import { ModelBasedAgent } from "@/lib/agents/ModelBasedAgent";
import { AStarPlanner } from "@/lib/agents/AStarPlanner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

type AgentType = "reflex" | "model-based";

interface LogEntry {
  step: number;
  altitude: number;
  wind: number;
  action: number;
  agent: string;
  explanation: string;
  isStable: boolean;
  usingAStar: boolean;
}

export const DroneSimulation = () => {
  const [environment] = useState(() => new DroneEnvironment(5));
  const [reflexAgent] = useState(() => new ReflexAgent());
  const [modelBasedAgent] = useState(() => new ModelBasedAgent());
  const [aStarPlanner] = useState(() => new AStarPlanner());

  const [isRunning, setIsRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentType>("reflex");
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentAltitude = environment.getAltitude();
  const [safeMin, safeMax] = environment.getSafeZone();
  const isStable = environment.isInSafeZone();
  const isCritical = environment.isCritical();

  // Simulation step
  const runStep = () => {
    // Apply wind disturbance
    const wind = environment.applyWind();
    const altitudeAfterWind = environment.getAltitude();

    let action = 0;
    let agent = currentAgent === "reflex" ? reflexAgent : modelBasedAgent;
    let explanation = "";
    let usingAStar = false;

    // Check if A* is needed (critical state)
    if (environment.isCritical()) {
      action = aStarPlanner.getNextAction(altitudeAfterWind);
      explanation = `🚨 CRITICAL! ${aStarPlanner.explainPath(altitudeAfterWind)}`;
      usingAStar = true;
    } else {
      // Use selected agent
      if (currentAgent === "model-based") {
        modelBasedAgent.updateModel(wind);
      }
      action = agent.decideAction(altitudeAfterWind);
      explanation = agent.explainAction(altitudeAfterWind, action);
    }

    // Apply agent action
    environment.applyAction(action);
    const finalAltitude = environment.getAltitude();

    // Create log entry
    const logEntry: LogEntry = {
      step: step + 1,
      altitude: finalAltitude,
      wind,
      action,
      agent: usingAStar ? "A* Planner" : agent.getName(),
      explanation,
      isStable: environment.isInSafeZone(),
      usingAStar,
    };

    setLogs((prev) => [...prev, logEntry]);
    setChartData((prev) => [
      ...prev,
      {
        step: step + 1,
        altitude: finalAltitude,
        safeMin,
        safeMax,
      },
    ]);
    setStep((prev) => prev + 1);
  };

  // Auto-run simulation
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runStep, 800);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, step, currentAgent]);

  // Reset simulation
  const handleReset = () => {
    setIsRunning(false);
    environment.reset(5);
    reflexAgent.reset();
    modelBasedAgent.reset();
    setStep(0);
    setLogs([]);
    setChartData([]);
  };

  // Toggle agent
  const handleAgentToggle = () => {
    setIsRunning(false);
    setCurrentAgent((prev) => (prev === "reflex" ? "model-based" : "reflex"));
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-rajdhani font-bold text-foreground">
            Drone Altitude AI
          </h1>
          <p className="text-muted-foreground text-lg font-inter">
            Autonomous stabilization with intelligent agents & A* pathfinding
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <Card className="lg:col-span-1 bg-card shadow-card border-border p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-rajdhani font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Control Panel
              </h2>

              {/* Agent Selection */}
              <div className="space-y-2">
                <label className="text-sm font-inter font-medium text-foreground">
                  Active Agent
                </label>
                <Button
                  onClick={handleAgentToggle}
                  disabled={isRunning}
                  variant="outline"
                  className="w-full justify-between h-12 border-border hover:border-primary transition-colors"
                >
                  <span className="font-inter">
                    {currentAgent === "reflex" ? "Reflex Agent" : "Model-Based Agent"}
                  </span>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {currentAgent === "reflex" ? "Rule-Based" : "Predictive"}
                  </Badge>
                </Button>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsRunning(!isRunning)}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-inter font-medium"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="h-12 px-4 border-border hover:border-destructive hover:text-destructive transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Current Status */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-lg font-rajdhani font-semibold text-foreground">
                Current Status
              </h3>
              
              <div className="space-y-3">
                {/* Altitude */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-inter text-muted-foreground">Altitude</span>
                  <Badge
                    variant="outline"
                    className={`text-lg font-rajdhani font-bold px-3 py-1 ${
                      isStable
                        ? "bg-success/20 text-success border-success/50"
                        : isCritical
                        ? "bg-destructive/20 text-destructive border-destructive/50 animate-pulse"
                        : "bg-warning/20 text-warning border-warning/50"
                    }`}
                  >
                    {currentAltitude}
                  </Badge>
                </div>

                {/* Step */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-inter text-muted-foreground">Step</span>
                  <span className="text-lg font-rajdhani font-bold text-foreground">
                    {step}
                  </span>
                </div>

                {/* Stability */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-inter text-muted-foreground">Status</span>
                  <Badge
                    variant={isStable ? "default" : isCritical ? "destructive" : "secondary"}
                    className={
                      isStable
                        ? "bg-success text-success-foreground"
                        : isCritical
                        ? "animate-pulse"
                        : "bg-warning text-warning-foreground"
                    }
                  >
                    {isStable ? "✓ Stable" : isCritical ? "⚠ Critical" : "○ Unstable"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Safe Zone Info */}
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <span className="font-rajdhani font-semibold text-success">Safe Zone</span>
              </div>
              <p className="text-sm font-inter text-muted-foreground">
                Target altitude: {safeMin} - {safeMax}
              </p>
            </div>
          </Card>

          {/* Visualization */}
          <Card className="lg:col-span-2 bg-card shadow-card border-border p-6 space-y-6">
            {/* Altitude Visualization */}
            <div className="space-y-4">
              <h2 className="text-2xl font-rajdhani font-semibold text-foreground flex items-center gap-2">
                <Wind className="w-6 h-6 text-primary" />
                Live Altitude
              </h2>

              {/* Altitude Bar */}
              <div className="relative h-80 bg-secondary/30 rounded-lg overflow-hidden">
                {/* Grid lines */}
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-border/30"
                    style={{ bottom: `${(i / 10) * 100}%` }}
                  >
                    <span className="absolute -left-8 -mt-2 text-xs text-muted-foreground font-inter">
                      {i}
                    </span>
                  </div>
                ))}

                {/* Safe Zone Highlight */}
                <div
                  className="absolute w-full bg-success/10 border-y-2 border-success/30"
                  style={{
                    bottom: `${(safeMin / 10) * 100}%`,
                    height: `${((safeMax - safeMin + 1) / 10) * 100}%`,
                  }}
                />

                {/* Drone */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-16 transition-all duration-500 ease-out"
                  style={{ bottom: `${(currentAltitude / 10) * 100}%` }}
                >
                  <div
                    className={`text-6xl animate-float ${
                      isCritical ? "animate-pulse-glow" : ""
                    }`}
                  >
                    🚁
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className="bg-primary text-primary-foreground shadow-glow font-rajdhani text-lg">
                      {currentAltitude}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Altitude History Chart */}
            <div className="space-y-4">
              <h3 className="text-xl font-rajdhani font-semibold text-foreground">
                Altitude History
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="step"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px", fontFamily: "Inter" }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px", fontFamily: "Inter" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontFamily: "Inter",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: "Inter", fontSize: "12px" }}
                    />
                    <ReferenceLine
                      y={safeMin}
                      stroke="hsl(var(--success))"
                      strokeDasharray="3 3"
                      label={{ value: "Safe Min", fill: "hsl(var(--success))" }}
                    />
                    <ReferenceLine
                      y={safeMax}
                      stroke="hsl(var(--success))"
                      strokeDasharray="3 3"
                      label={{ value: "Safe Max", fill: "hsl(var(--success))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="altitude"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground font-inter">
                  Start simulation to see altitude history
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Logs */}
        <Card className="bg-card shadow-card border-border p-6">
          <h2 className="text-2xl font-rajdhani font-semibold text-foreground mb-4">
            Simulation Log
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground font-inter text-center py-8">
                No logs yet. Start the simulation!
              </p>
            ) : (
              [...logs].reverse().map((log, idx) => (
                <div
                  key={log.step}
                  className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-border hover:border-primary/50 transition-colors animate-slide-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Badge
                    variant="outline"
                    className="font-rajdhani font-bold shrink-0 mt-0.5"
                  >
                    #{log.step}
                  </Badge>
                  <div className="flex-1 space-y-1 font-inter text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Alt:</span>
                      <Badge
                        variant={log.isStable ? "default" : "destructive"}
                        className={
                          log.isStable
                            ? "bg-success/20 text-success border-success/50"
                            : log.usingAStar
                            ? "bg-destructive/20 text-destructive border-destructive/50"
                            : "bg-warning/20 text-warning border-warning/50"
                        }
                      >
                        {log.altitude}
                      </Badge>
                      <span className="text-muted-foreground">Wind:</span>
                      <Badge variant="outline">{log.wind > 0 ? `+${log.wind}` : log.wind}</Badge>
                      <span className="text-muted-foreground">Action:</span>
                      <Badge variant="secondary">
                        {log.action > 0 ? `+${log.action}` : log.action}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          log.usingAStar
                            ? "bg-destructive/20 text-destructive border-destructive/50"
                            : "bg-primary/20 text-primary border-primary/50"
                        }
                      >
                        {log.agent}
                      </Badge>
                    </div>
                    <p className="text-foreground">{log.explanation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

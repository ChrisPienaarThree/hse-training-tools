/* RCA Fault Tree — user guide (shown on the User guide tab). */
var RCAGUIDE = `
<span class="eyebrow">User guide</span><h1>RCA Fault Tree</h1>
<p>A cause-and-effect fault tree for <b>root cause analysis</b>. The top event is the incident that happened. Below it you set out every way it could have happened, test each branch against the evidence, and keep the branches that survive. Probabilities are optional. When you enter them, they rank the hypotheses that are still open, so you know what to test first.</p>
<p>It is not a risk-assessment tool: it does not ask whether a design is good enough. For quantitative design studies (PFDavg, SIL, test intervals) use the Fault Tree and PFD Calculator in the Process Safety Analysis Toolkit.</p>

<h2>1. Quick start</h2>
<ul>
<li><b>File ▸ New fault tree</b>, then describe the incident on the <b>Incident</b> tab.</li>
<li>On the <b>Fault tree</b> tab, select the top event and add its causes with <b>+ Gate</b> (an intermediate event that you develop further) or <b>+ Basic event</b> (a cause you do not break down).</li>
<li>Choose the gate logic: <b>OR</b> if any one input is enough, <b>AND</b> if all inputs were needed together.</li>
<li>For each element set the <b>hypothesis status</b> and record the <b>evidence</b>. Plan a <b>test</b> for those still open.</li>
<li>Optionally give events a probability, from the data library or as a manual value.</li>
<li>Classify the confirmed causes (root cause, causal factor, contributing factor), add <b>Actions</b>, and produce the <b>Report</b>.</li>
<li><b>File ▸ Save as</b> links a file in the <code>My cases</code> folder on the stick. After that, every change is written to the file.</li>
</ul>

<h2>2. Symbols</h2>
<ul>
<li><b>Box</b>: the description of every event. The coloured stripe on the left is the hypothesis status.</li>
<li><b>OR gate</b> (curved shield): the output occurs if any input occurs.</li>
<li><b>AND gate</b> (flat-bottomed dome): the output occurs only if all inputs occur together.</li>
<li><b>INHIBIT gate</b> (hexagon): the output occurs if the input occurs while an enabling condition is present. Show the condition as a condition (house) event.</li>
<li><b>VOTE gate</b> (shield with k/n): the output occurs if at least k of the n inputs occur.</li>
<li><b>Basic event</b> (circle): a cause that is not developed further.</li>
<li><b>Undeveloped event</b> (diamond): a cause not developed, for lack of information or because it is outside the scope.</li>
<li><b>Condition / house event</b> (house): a condition that was or was not present (for example, a single operator on shift). Its value is usually 1 (present) or 0 (absent).</li>
<li><b>Triangle</b>: a collapsed branch. Select the gate and choose Expand branch.</li>
</ul>

<h2>3. Hypothesis status</h2>
<ul>
<li><b>Confirmed</b>: the evidence shows it happened.</li>
<li><b>Likely</b>: the evidence points to it but is not conclusive yet.</li>
<li><b>Unverified</b>: still to be tested.</li>
<li><b>Ruled out</b>: the evidence shows it did not happen. The branch is drawn dashed and struck through, and it drops out of the causal combinations.</li>
</ul>
<p>The consistency check (Results tab) flags contradictions. Examples: a confirmed gate whose causes are all ruled out (the real cause is missing from the tree), a confirmed AND gate with a ruled-out input, or a confirmed cause under a ruled-out branch.</p>

<h2>4. Probabilities and the data library</h2>
<p>Each event chooses its own source, so one tree can mix failure types:</p>
<ul>
<li><b>Safeguard / IPL PFD</b>: typical probability of failure on demand of protection layers (CCPS LOPA, IEC 61511 SIL bands).</li>
<li><b>Human error probability</b>: THERP and HEART generic task values.</li>
<li><b>Equipment failure on demand</b>: generic per-demand values for pumps, valves, switches, transmitters, lifting gear and so on.</li>
<li><b>Initiating event frequency</b>: typical frequencies per year (CCPS LOPA).</li>
<li><b>Manual value</b>: your own probability or frequency.</li>
<li><b>Site data</b>: custom items you add on the Data library tab (for example from CMMS history).</li>
</ul>
<p>Picking a library item fills in its value. You can then <b>edit the value for that event</b> (for example, scale a switch PFD up because its proof test was 18 months overdue). The panel then shows the event as edited, and you should record why in the value note. <b>Use library value</b> puts it back. On the Data library tab you can also override an item for the whole case; events that use it and were not edited individually follow the new value.</p>
<p>Units: probability (0 to 1) or frequency (per year). An OR gate must combine inputs of the same unit. An AND gate may have at most one frequency input; the result is then a frequency (frequency × probabilities).</p>

<h2>5. How the numbers are calculated</h2>
<ul>
<li>OR: 1 − Π(1 − p<sub>i</sub>) for probabilities; Σ f<sub>i</sub> for frequencies.</li>
<li>AND / INHIBIT: Π p<sub>i</sub>, or f × Π p<sub>i</sub> with one frequency input.</li>
<li>VOTE k of n: probability that at least k of the n inputs occur.</li>
<li>The tree is evaluated exactly. Each element appears once, so the branches are independent.</li>
<li><b>Before evidence</b>: every hypothesis at its screening value, giving how likely the incident path was before the investigation.</li>
<li><b>Given evidence</b>: ruled-out causes count as 0 and confirmed probability causes as 1.</li>
<li><b>Given the incident</b>, for each open hypothesis X: P(X contributed | top event and evidence) = p(X) × P(top | X occurred) / P(top). For a frequency (initiating) event it is that event's share of the top frequency. This is the ranking on the Results tab and the percentage shown on the tree.</li>
<li><b>Credible causal combinations</b> are the minimal cut sets of the tree with ruled-out causes removed. Each is a set of causes that together are enough to produce the top event. They are sorted by status (all confirmed first) and then by likelihood.</li>
</ul>
<p>If an open branch has an event without a value, the percentages that depend on it show “needs values”. The qualitative analysis still works.</p>

<h2>6. Saving on the USB stick</h2>
<ul>
<li>The tool keeps your work in the browser of the computer you are using. That copy does not travel with the stick.</li>
<li><b>File ▸ Save as</b> (Chrome or Edge) links a file in <code>My cases</code>. Every later change is written to it, and the header shows “Saved to …”.</li>
<li>On another computer, open the tool from the stick and use <b>File ▸ Open file</b>. If the header shows <b>Reconnect file</b>, click it: the browser asks for permission again after a restart.</li>
<li>Firefox and Safari cannot link files. Use <b>Download backup copy</b> and open it again later.</li>
<li>The START HERE dashboard lists the cases in <code>My cases</code> and those kept only in this browser.</li>
</ul>

<h2>7. Limitations</h2>
<ul>
<li>Library values are generic, order-of-magnitude screening values. Use them to rank hypotheses, not as design data. Replace them with site data where you have it.</li>
<li>Elements cannot be shared between branches (each appears once). If the same cause acts in two places, model the dependency explicitly, for example with a common condition event.</li>
<li>Probability never confirms a cause. A low percentage is not evidence that something did not happen; only evidence rules a cause out.</li>
</ul>
`;
if (typeof module !== 'undefined') module.exports = RCAGUIDE;

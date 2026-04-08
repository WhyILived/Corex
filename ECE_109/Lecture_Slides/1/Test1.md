# Test1: Knowledge Check
> Tests: Learn1 material (Wave Equation and Electromagnetic Waves)
> Time: ~15 minutes

## Conceptual Questions

1. State the wave equation in both 3D and 1D forms, and explain what each term represents.

2. Explain why the superposition principle applies to the wave equation. If $f_1(x,t)$ and $f_2(x,t)$ are both solutions to the 1D wave equation, is their sum also a solution? Why?

3. What is the physical interpretation of light being an electromagnetic wave? What quantity oscillates in a light wave?

4. Match each vector calculus operation with its input-output behavior:
   - Gradient
   - Divergence
   - Curl
   - Scalar Laplacian
   - Vector Laplacian

## Calculation Problems

1. Write the explicit form of the scalar Laplacian in 3D Cartesian coordinates.

2. If a wave function is $u(x,y,z,t) = A\sin(kx - \omega t)$, verify whether it satisfies the 1D wave equation $\frac{\partial^2 u}{\partial x^2} - \frac{1}{c^2}\frac{\partial^2 u}{\partial t^2} = 0$.

3. Given $\phi(x,y,z) = x^2 + y^2 + z^2$, calculate $\nabla \phi$.

4. For a vector field $\vec{A} = x\hat{x} + y\hat{y} + z\hat{z}$, calculate $\nabla \cdot \vec{A}$.

## Answers

1. The 3D wave equation: $\nabla^2 u - \frac{1}{c^2}\frac{\partial^2 u}{\partial t^2} = 0$
   The 1D wave equation: $\frac{\partial^2 E}{\partial z^2} - \frac{1}{c^2}\frac{\partial^2 E}{\partial t^2} = 0$
   - $\nabla^2$ is the Laplacian operator
   - $u$ is the wave function (could be scalar like pressure or vector like electric field)
   - $c$ is the speed of wave propagation
   - The equation describes how the curvature of the wave in space relates to its time variation

2. Yes, the sum is also a solution. The wave equation is linear, meaning it contains $u$ and its derivatives only to the first power. If $f$ and $g$ individually satisfy $\nabla^2 f - \frac{1}{c^2}\frac{\partial^2 f}{\partial t^2} = 0$ and $\nabla^2 g - \frac{1}{c^2}\frac{\partial^2 g}{\partial t^2} = 0$, then substituting $h = f + g$ gives:
   $\nabla^2(f+g) - \frac{1}{c^2}\frac{\partial^2(f+g)}{\partial t^2} = (\nabla^2 f - \frac{1}{c^2}\frac{\partial^2 f}{\partial t^2}) + (\nabla^2 g - \frac{1}{c^2}\frac{\partial^2 g}{\partial t^2}) = 0$
   Therefore, $h$ is also a solution.

3. Light is an electromagnetic wave where the electric and magnetic field strengths oscillate perpendicular to the direction of propagation. The quantities that oscillate are the electric field amplitude $E$ and magnetic field amplitude $B$.

4.
   - Gradient: scalar → vector
   - Divergence: vector → scalar
   - Curl: vector → vector
   - Scalar Laplacian: scalar → scalar (divergence of gradient)
   - Vector Laplacian: vector → vector (applies scalar Laplacian to each component)

**Calculation Answers:**

1. $\nabla^2 \phi = \frac{\partial^2 \phi}{\partial x^2} + \frac{\partial^2 \phi}{\partial y^2} + \frac{\partial^2 \phi}{\partial z^2}$

2. For $u = A\sin(kx - \omega t)$:
   - $\frac{\partial^2 u}{\partial x^2} = -k^2 A\sin(kx - \omega t)$
   - $\frac{\partial^2 u}{\partial t^2} = -\omega^2 A\sin(kx - \omega t)$
   
   Substituting into the wave equation:
   $-k^2 A\sin(kx - \omega t) - \frac{1}{c^2}(-\omega^2 A\sin(kx - \omega t)) = -A\sin(kx - \omega t)(k^2 - \frac{\omega^2}{c^2}) = 0$
   
   This equals zero only if $k^2 = \frac{\omega^2}{c^2}$, meaning $c = \frac{\omega}{k}$ (the phase velocity condition). So yes, it satisfies the wave equation if this condition is met.

3. $\nabla \phi = \frac{\partial}{\partial x}(x^2+y^2+z^2)\hat{x} + \frac{\partial}{\partial y}(x^2+y^2+z^2)\hat{y} + \frac{\partial}{\partial z}(x^2+y^2+z^2)\hat{z} = 2x\hat{x} + 2y\hat{y} + 2z\hat{z}$

4. $\nabla \cdot \vec{A} = \frac{\partial x}{\partial x} + \frac{\partial y}{\partial y} + \frac{\partial z}{\partial z} = 1 + 1 + 1 = 3$
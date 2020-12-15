// #![feature(vec_into_raw_parts)]
use wasm_bindgen::prelude::*;

struct Complex {
	pub re: f32,
	pub im: f32
}
impl Complex {
	fn escape(&self, iterations: usize) -> usize {
		let mut x = self.re;
		let mut y = self.im;
		let mut i = 0;
		while i <= iterations {
			let x2 = x * x;
			let y2 = y * y;
			if x2 + y2 > 4.0 {
				// Escape
				break;
			}
			y = 2.0 * y * x + self.im;
			x = x2 - y2 + self.re;
			i += 1;
		}
		i
	}
}

#[wasm_bindgen]
pub fn render(resolution: usize, x_center: f32, y_center: f32, scale: f32, iterations: usize) -> Vec<u8> {
	let mut buffer = Vec::with_capacity(resolution * resolution * 4);
	for y in 0..resolution {
		for x in 0..resolution {
			let resolution = resolution as f32;
			let y = y as f32;
			let x = x as f32;
			let re = x_center + (4.0 * x / resolution - 2.0) as f32 * scale;
			let im = y_center - (4.0 * y / resolution - 2.0) as f32 * scale;

			let esc = Complex { re, im }.escape(iterations);

			let intensity = ((esc * 255) as f32 / iterations as f32) as u8;
			buffer.push(intensity);
			buffer.push(intensity);
			buffer.push(intensity);
			buffer.push(255);
		}
	}
	
	buffer
}
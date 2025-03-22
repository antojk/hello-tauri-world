// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use serde::Deserialize;
use tauri::{generate_context, generate_handler};

#[derive(Deserialize,Debug)]
struct Point {
    x: i32,
    y: i32,
}

#[derive(Deserialize,Debug)]
struct Rectangle {
    top_left: Point,
    bottom_right: Point,
}

impl Rectangle {
    fn length(&self) -> i32 {
        let Point { x: x1, y: _y1 } = self.top_left;
        let Point { x: x2, y: _y2 } = self.bottom_right;
        return x2 - x1;
    }

    fn height(&self) -> i32 {
        let Point { x: _x1, y: y1 } = self.top_left;
        let Point { x: _x2, y: y2 } = self.bottom_right;
        return y2 - y1;
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command(rename_all = "snake_case")]
fn calc_area(target: Rectangle) -> Result<u32, String> {
    if target.length() < 0 {
        return Err("Length cannot be negative".to_string());
    }
    if target.height() < 0 {
        return Err("Width cannot be negative!".to_string());
    }
    let area = target.length() * target.height();
    Ok(area as u32)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(generate_handler![greet, calc_area])
        .run(generate_context!())
        .expect("error while running tauri application");
}

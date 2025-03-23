// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use std::f32::consts;

use serde::Deserialize;
use tauri::{generate_context, generate_handler};

trait HasArea {
    fn is_valid(&self) -> Result<bool, String>;

    fn area(&self) -> f32;
}

#[derive(Deserialize, Debug)]
struct Point {
    x: f32,
    y: f32,
}

#[derive(Deserialize, Debug)]
struct Rectangle {
    top_left: Point,
    bottom_right: Point,
}

impl Rectangle {
    // This function normalizes the rectangle so that top_left actually has
    // the smaller coordinates and bottom_right has the larger ones
    fn normalize(&self) -> Rectangle {
        Rectangle {
            top_left: Point {
                x: self.top_left.x.min(self.bottom_right.x),
                y: self.top_left.y.min(self.bottom_right.y),
            },
            bottom_right: Point {
                x: self.top_left.x.max(self.bottom_right.x),
                y: self.top_left.y.max(self.bottom_right.y),
            },
        }
    }

    fn length(&self) -> f32 {
        let Point { x: x1, y: _y1 } = self.top_left;
        let Point { x: x2, y: _y2 } = self.bottom_right;
        return (x2 - x1).abs();
    }

    fn height(&self) -> f32 {
        let Point { x: _x1, y: y1 } = self.top_left;
        let Point { x: _x2, y: y2 } = self.bottom_right;
        return (y2 - y1).abs();
    }
}

impl HasArea for Rectangle {
    fn is_valid(&self) -> Result<bool, String> {
        let normalized = self.normalize();

        // Now we can safely calculate the area
        let length = normalized.length();
        let height = normalized.height();

        if length > 0f32 || height > 0f32 {
            Ok(true)
        } else {
            Err("Length or hieght of a rectangle cannot be less than zero!".to_string())
        }
    }

    fn area(&self) -> f32 {
        let normalized = self.normalize();
        return normalized.length() * normalized.height();
    }
}
#[derive(Deserialize, Debug)]
struct Circle {
    center: Point,
    radius: f32,
}

impl HasArea for Circle {
    fn is_valid(&self) -> Result<bool, String> {
        if self.radius > 0.0 {
            Ok(true)
        } else {
            Err("Radius of circle should not be zero ro less!".to_string())
        }
    }

    fn area(&self) -> f32 {
        return consts::PI * self.radius.powi(2);
    }
}

#[derive(Deserialize, Debug)]
struct Polygon {
    points: Vec<Point>,
}

impl HasArea for Polygon {
    fn is_valid(&self) -> Result<bool, String> {
        if self.points.len() > 3 {
            Ok(true)
        } else {
            Err("A poligon should have 3 or more sides!".to_string())
        }
    }

    /**
     * Polygon area using Shoelace formula
     */
    fn area(&self) -> f32 {
        let mut area = 0f32;
        let n: usize = self.points.len();
        let points = &self.points;
        for (i, _coord) in points.iter().enumerate() {
            let j: usize = (i + 1) % n;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        return area.abs() / 2f32;
    }
}

fn calc_area(target: &impl HasArea) -> Result<f32, String> {
    if target.is_valid()? {
        Ok(target.area())
    } else {
        Err("The shape object is invalid!".to_string())
    }
}
#[tauri::command(rename_all = "snake_case")]
fn calc_rectangle_area(shape: Rectangle) -> Result<f32, String> {
    calc_area(&shape)
}
#[tauri::command(rename_all = "snake_case")]
fn calc_circle_area(shape: Circle) -> Result<f32, String> {
    calc_area(&shape)
}

#[tauri::command(rename_all = "snake_case")]
fn calc_polygon_area(shape: Polygon) -> Result<f32, String> {
    calc_area(&shape)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(generate_handler![
            calc_rectangle_area,
            calc_circle_area,
            calc_polygon_area
        ])
        .run(generate_context!())
        .expect("error while running tauri application");
}

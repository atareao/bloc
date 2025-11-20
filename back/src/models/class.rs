use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum Class{
    Page,
    Post,
    Tag,
    Comment,
}

impl Class {
    pub fn value(&self) -> &str {
        match self {
            Class::Page => "page",
            Class::Post => "post",
            Class::Tag => "tag",
            Class::Comment => "comment",
        }
    }
}

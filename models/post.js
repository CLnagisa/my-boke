var mongodb = require('./db');
	//markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
	var date = new Date();
	//存储各种时间格式，方便以后扩展
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};
	//要存入数据库的文档
	var post = {
		hear: this.head,
        time: time,
        name: this.name,
        tags: this.tags,
        post: this.post,
        title: this.title,
        comments: [],
        reprint_info: {},
        pv: 0
    };
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//将文档插入posts集合
			collection.insert(post, {
				safe: true
			}, function(err) {
				mongodb.close();
				if(err) {
					return callback(err);//失败！返回err
				}
				callback(null);//返回err为null
			});
		});
	});
};



//读取文章及其相关信息
Post.getTen = function(name, page, callback) {
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//读取posts集合
			db.collection('posts', function(err, collection) {
				if(err) {
					mongodb.close();
					return callback(err);
				}
				var query = {};
				if(name) {
					query.name = name;
				}
				//使用count返回特定查询的文档数total
				collection.count(query, function(err, total) {
					//根据query对象查询，并跳过前(page-1) * 10歌结果，返回之后的10个结果
					collection.find(query, {
						skip: (page - 1) * 10,
						limit: 10
					}).sort({
						time: -1
					}).toArray(function(err, docs) {
						mongodb.close();
						if(err) {
							return callback(err);
						}
						//解析markdown为html
						//docs.forEach(function(doc) {
						//	doc.post = markdown.toHTML(doc.post);
						//});
						callback(null, docs, total);
					});
				});
			});
		});
	});
};

//获取一篇文章
Post.getOne = function(name, day, title, callback) {
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return calllback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//根据用户名，发表日期以及文章名进行查询
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				if(err) {
					mongodb.close();
					return callback(err);
				}
				//解析markdown为html
				//doc.post = markdown.toHTML(doc.post);
				if(doc) {
					//每访问1次，pv值增加1
					collection.update({
						"name": name,
						"time.day": day,
						"title": title
					}, {
						$inc: {"pv": 1}
					}, function(err) {
						mongodb.close();
						if(err) {
							return callback(err);
						}
					});
					//doc.post = markdown.toHTML(doc.post);
					//doc.comments.forEach(function(comment) {
					//	comment.content = markdown.toHTML(comment.content);
					//})
				}
				callback(null, doc);  //返回查询的一篇文章
			});
		});
	});
};

//返回原始发表的内容（markdown格式）
Post.edit = function(name, day, title, callback) {
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//根据用户名，发表日期以及文章名进行查询
			collection.findOne({
				"name": name, 
				"time.day": day,
				"title": title
			}, function(err, doc) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, doc);  //返回查询的一篇文章（markdown格式）
			});
		});
	});
};

//更新一篇文章及其相关信息
Post.update = function(name, day, title, post, callback) {
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取【】posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//更新文章内容
			collection.update({
				"name": name, 
				"time.day": day,
				"title": title
			}, {
				$set: {post: post}
			}, function(err) {
				if(err) {
					return callback(err);
				}
				callback(null);
			});
		});
	});
};

//删除一篇文章
Post.remove = function(name, day, title, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongode.colse();
				return callback(err);
			}
			//查询要删除的文档
			collection.findOne({
				"name": name,
				"time.day": day,
				"title": title
			}, function(err, doc) {
				if(err) {
					mongodb.close();
					return callback(err);
				}
				//如果有reprint_from，即该文章是转载过来的，先保存下reprint_from
				var reprint_from = "";
				if(doc.reprint_info.reprint_from) {
					reprint_from = doc.reprint_info.reprint_from;
				}
				if(reprint_from != "") {
					//更新原文章所在文档的reprint_to
					collection.update({
						"name": reprint_from.name,
						"time.day": reprint_from.day,
						"title": reprint_from.title
					}, {
						$pull: {
							"reprint_info.reprint_to": {
								"name": name, 
								"day": day,
								"title": title
							}
						}
					}, function(err) {
						if(err) {
							mongodb.close();
							return callback(err);
						}
					});
				}
				//删除转载来的文章所在的文档
				collection.remove({
					"name": name,
					"time.day": day,
					"title": title
				}, {
					w: 1
				}, function(err) {
					if(err) {
						return callback(err);
					}
					callback(null);
				});
				
			});
			
		});
	});
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
	//打开数据库
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		//读取posts集合
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//返回只包含name、time、title属性的文档组成的存档数组
			collection.find({}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回所有标签
Post.getTags = function(callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, docs) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//distinct用来找出给定键的所有不同值
			collection.distinct('tags', function(err, docs) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
	mongodb.open(function (err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return cllback(err);
			}
			//查询所有tags数组内包含tag的文档
			//并返回只含有name、time、title组成的数组
			collection.find({
				"tags": tag
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err)
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title": pattern
			}, {
				"name": 1,
				"time": 1,
				"title": 1
			}).sort({
				time: -1
			}).toArray(function(err, docs) {
				mongodb.close();
				if(err) {
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
};

//转载一篇文章
Post.reprint = function(reprint_from, reprint_to, callback) {
	mongodb.open(function(err, db) {
		if(err) {
			return callback(err);
		}
		db.collection('posts', function(err, collection) {
			if(err) {
				mongodb.close();
				return callback(err);
			}
			//找打被转载的文章的原文档
			collection.findOne({
				"name": reprint_from.name,
				"time.day": reprint_from.day,
				"title": reprint_from.title
			}, function(err, doc) {
				if(err) {
					mongodb.close();
					return callback(err);		
				}

				var date = new Date();
				var time = {
					date: date,
					year: date.getFullYear(),
					month: date.getFullYear() + "-" + (date.getMonth() + 1),
					day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
					minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
				};

				delete doc._id; //注意需要删除原来的_id

				doc.name= reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title : "[转载]" + doc.title;
				doc.comments = [];
				doc.reprint_info = {"reprint_from": reprint_from};
				doc.pv = 0;

				//更新被转载的原文档的reprint_info内的reprint_to
				collection.update({
					"name": reprint_from.name,
					"time.day": reprint_from.day,
					"title": reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to": {
							"name": doc.name,
							"day": time.day,
							"title": doc.title
						}
					}
		
				}, function(err) {
					if(err) {
						mongodb.close();
						return callback(err);
					}
				});

				//将转载生成的副本修改后存入数据库，并返回存储后的文档
				collection.insert(doc, {
					safe: true
				}, function(err, post) {
					mongodb.close();
					if(err) {
						return callback(err);
					}
					callback(err, post[0]);
				});
			});
		});
	});
};


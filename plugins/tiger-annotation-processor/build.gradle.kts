plugins {
    id("java-library")
    id("org.jetbrains.kotlin.jvm") version "1.9.23"
    id("org.jetbrains.kotlin.kapt") version "1.9.23"
    `maven-publish`
}

group = "io.github.himanshukumardutt094"
version = "1.0.0"

repositories {
    mavenLocal()
    mavenCentral()
    google()
}

dependencies {
    implementation(kotlin("stdlib"))
    implementation("com.squareup:kotlinpoet:1.16.0")
    implementation("com.google.auto.service:auto-service:1.1.1")
    kapt("com.google.auto.service:auto-service:1.1.1")
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

kotlin {
    jvmToolchain(11)
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            
            pom {
                name.set("Tiger Annotation Processor")
                description.set("Annotation processor for Tiger native modules")
                url.set("https://github.com/himanshukumardutt094/tiger")
                
                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }
                
                developers {
                    developer {
                        id.set("himanshukumardutt094")
                        name.set("Himanshu Kumar")
                    }
                }
                
                scm {
                    connection.set("scm:git:git://github.com/himanshukumardutt094/tiger.git")
                    developerConnection.set("scm:git:ssh://github.com/himanshukumardutt094/tiger.git")
                    url.set("https://github.com/himanshukumardutt094/tiger")
                }
            }
        }
    }
    
    repositories {
        mavenLocal()
    }
}

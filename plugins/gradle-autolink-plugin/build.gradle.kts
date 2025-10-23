plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
    `maven-publish`
}

group = "com.tigermodule"
version = "0.0.1"

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation(gradleApi())
    implementation(kotlin("stdlib"))
    
    // For JSON parsing
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation(gradleTestKit())
}

gradlePlugin {
    plugins {
        create("tigerModuleExtensionSettings") {
            id = "com.tigermodule.extension-settings"
            implementationClass = "com.tigermodule.autolink.TigerModuleExtensionSettingsPlugin"
            displayName = "TigerModule Extension Settings Plugin"
            description = "Gradle settings plugin for discovering and configuring TigerModule extensions"
        }
        create("tigerModuleExtensionBuild") {
            id = "com.tigermodule.extension-build"
            implementationClass = "com.tigermodule.autolink.TigerModuleExtensionBuildPlugin"
            displayName = "TigerModule Extension Build Plugin"
            description = "Gradle build plugin for integrating TigerModule extensions into Android projects"
        }
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "11"
    }
}

publishing {
    repositories {
        maven {
            name = "local"
            url = uri(layout.buildDirectory.dir("repo"))
        }
    }
}

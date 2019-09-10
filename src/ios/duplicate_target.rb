#!/usr/bin/env ruby

require 'rubygems'
require 'xcodeproj'

$src_target_name = ARGV[1]
$new_target_name = ARGV[2]

def get_src_target(proj)
    src_target = proj.targets.find { |item| 
        item.name == $src_target_name
    }
    return src_target
end

def get_dependent_targets(proj, main_uuid)
    if main_uuid.empty?
        return []
    end
    dependencies_array = Array.new
    #PBXNativeTarget(inner target) -> PBXTargetDependency -> PBXNativeTarget(main target)
    proj.targets.each { |item|
        item.dependencies.each { |t_item|
            if t_item.target.uuid.eql?(main_uuid) 
                dependencies_array << item
            end
        }
    }
    return dependencies_array
end

def clear_env(proj)
    proj.targets.delete_if { |item| 
        item.product_name.index($new_target_name) == 0 #the same prefix
    }
end

def get_target_name(src_name)
    replaced_name = ""
    target_prefix = $new_target_name.to_s
    index = src_name.index($src_target_name)
    if src_name.eql?($src_target_name)
        replaced_name = src_names
    elsif index == 0 && src_name.length > $src_target_name.length #prefix
        replaced_name = target_prefix + src_name[index + $src_target_name.length..src_name.length]
    else
        replaced_name = target_prefix + src_name.titleize
    end
    return replaced_name
end

def create_targets(proj, src_target, dependencies_array)
    target = proj.new_target(src_target.symbol_type, $new_target_name, src_target.platform_name, src_target.deployment_target)

    dependencies_array.each { |item|
        name = get_target_name(item.name)
        dep_target = proj.new_target(src_target.symbol_type, name, src_target.platform_name, src_target.deployment_target)
        dep_target.product_name = name
        dep_target.product_type = item.product_type
        dep_target.add_dependency(target)
    }
    return target
end

def create_scheme(target)
    scheme = Xcodeproj::XCScheme.new
    scheme.add_build_target(target)
    scheme.set_launch_target(target)
    # scheme.save_as(proj.path, new_target_name)
end

def copy_settings(src_target, target)
    # copy build_configurations
    target.build_configurations.map do |item|
        item.build_settings.update(src_target.build_settings(item.name))
    end
    # Copy the build phases
    target.build_phases.clear
    src_target.build_phases.each do |phase|
        target.build_phases << phase
    end
end

def add_files(proj, target)
    classes = proj.main_group.groups.find { |x| x.to_s == 'Group' }.groups.find { |x| x.name == 'Classes' }
    sources = target.build_phases.find { |x| x.instance_of? Xcodeproj::Project::Object::PBXSourcesBuildPhase }
    # file_ref = classes.new_file('test.m')
    build_file = proj.new(Xcodeproj::Project::Object::PBXBuildFile)
    # build_file.file_ref = file_ref
    sources.files << build_file
end

def create_runner_target(proj, src_target, dependencies_array)
    clear_env(proj)
    target = create_targets(proj, src_target, dependencies_array)
    create_scheme(target)
    copy_settings(src_target, target)
    add_files(proj, target)
    proj.save
end

if __FILE__ == $0
    proj = Xcodeproj::Project.open(ARGV[0])
    src_target = get_src_target(proj)
    dependencies_array = get_dependent_targets(proj, src_target.uuid)
    if !dependencies_array.empty?
        create_runner_target(proj, src_target, dependencies_array)
    end
end

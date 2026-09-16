"""Generate the sample study PDF used by the RAG eval.

The PDF is committed, so this script only needs re-running if the content
changes. It writes real text (not images), because the ingestion pipeline
extracts text with PyMuPDF.

Usage:
    python evals/make_sample_pdf.py
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

OUTPUT = Path(__file__).parent / "data" / "os_notes.pdf"

PAGES: list[tuple[str, list[str]]] = [
    (
        "Operating Systems - Process Management",
        [
            "A process is a program in execution, together with its current activity.",
            "Each process is represented in the operating system by a process control block.",
            "The process control block stores the process id, the program counter, CPU registers,",
            "scheduling information, memory management information and accounting information.",
            "",
            "A process moves through five states during its lifetime.",
            "The new state means the process is being created.",
            "The ready state means the process is waiting to be assigned to a processor.",
            "The running state means instructions are being executed.",
            "The waiting state means the process is waiting for some event such as input or output.",
            "The terminated state means the process has finished execution.",
            "",
            "A context switch is the act of saving the state of one process and loading the state",
            "of another. Context switching is pure overhead because the system does no useful work",
            "while it happens. The cost of a context switch is typically a few microseconds.",
            "",
            "A thread is the smallest unit of execution inside a process.",
            "Threads inside the same process share the code section, the data section and open files,",
            "but each thread keeps its own stack, register set and program counter.",
        ],
    ),
    (
        "Operating Systems - CPU Scheduling",
        [
            "CPU scheduling decides which of the ready processes gets the processor next.",
            "",
            "First Come First Served schedules processes in arrival order.",
            "It is simple but suffers from the convoy effect, where short jobs wait behind long ones.",
            "",
            "Shortest Job First selects the process with the smallest next CPU burst.",
            "Shortest Job First gives the minimum average waiting time of any scheduling algorithm,",
            "but it requires knowing the length of the next CPU burst in advance.",
            "",
            "Round Robin assigns a fixed time slice, called a quantum, to each process in turn.",
            "When the quantum expires the process is preempted and moved to the back of the queue.",
            "A typical quantum is between 10 and 100 milliseconds.",
            "If the quantum is too large Round Robin degenerates into First Come First Served.",
            "If the quantum is too small the system spends most of its time context switching.",
            "",
            "Priority scheduling runs the process with the highest priority first.",
            "Priority scheduling can cause starvation, where a low priority process never runs.",
            "Starvation is solved by aging, which gradually raises the priority of waiting processes.",
            "",
            "Throughput is the number of processes completed per unit of time.",
            "Turnaround time is the total time taken from submission to completion of a process.",
            "Waiting time is the total time a process spends in the ready queue.",
        ],
    ),
    (
        "Operating Systems - Memory Management",
        [
            "Paging is a memory management scheme that removes the need for contiguous allocation.",
            "Physical memory is divided into fixed size blocks called frames.",
            "Logical memory is divided into blocks of the same size called pages.",
            "A page table maps each page number to the frame number that holds it.",
            "",
            "Internal fragmentation happens when allocated memory is larger than requested memory,",
            "and the unused space sits inside the allocated block.",
            "External fragmentation happens when free memory is split into small non contiguous holes.",
            "Paging suffers from internal fragmentation but not from external fragmentation.",
            "",
            "Segmentation divides a program into variable length segments such as code, stack and heap.",
            "Segmentation matches the programmer's view of memory, while paging does not.",
            "Segmentation suffers from external fragmentation because segments vary in size.",
            "",
            "Virtual memory lets a process execute even when it is not completely in physical memory.",
            "Demand paging loads a page only when it is referenced.",
            "A page fault occurs when a referenced page is not present in physical memory.",
            "Thrashing is the condition where the system spends more time paging than executing.",
            "",
            "The translation lookaside buffer is a small fast cache of recent page table entries.",
            "A hit in the translation lookaside buffer avoids a second memory access.",
        ],
    ),
    (
        "Operating Systems - Deadlock",
        [
            "A deadlock is a state where every process in a set is waiting for an event",
            "that only another process in the same set can cause.",
            "",
            "Four conditions must hold at the same time for a deadlock to occur.",
            "Mutual exclusion means at least one resource is held in a non sharable mode.",
            "Hold and wait means a process holds one resource while waiting for another.",
            "No preemption means a resource can only be released voluntarily by the process holding it.",
            "Circular wait means a closed chain of processes exists, each waiting for the next.",
            "",
            "The banker's algorithm is a deadlock avoidance algorithm.",
            "It only grants a resource request if the resulting state is safe.",
            "A state is safe if there is a sequence in which every process can finish.",
            "",
            "Deadlock detection allows deadlocks to happen and then recovers from them.",
            "Recovery is done either by terminating processes or by preempting resources.",
        ],
    ),
]


def build_pdf(output: Path = OUTPUT) -> Path:
    output.parent.mkdir(parents=True, exist_ok=True)

    doc = fitz.open()
    for title, lines in PAGES:
        page = doc.new_page()
        page.insert_text((60, 70), title, fontsize=15, fontname="helv")
        y = 105
        for line in lines:
            if line:
                page.insert_text((60, y), line, fontsize=10, fontname="helv")
            y += 16
    doc.save(str(output))
    doc.close()

    return output


if __name__ == "__main__":
    path = build_pdf()
    total_lines = sum(len(lines) for _, lines in PAGES)
    print(f"Wrote {path} | pages={len(PAGES)} | content lines={total_lines}")
